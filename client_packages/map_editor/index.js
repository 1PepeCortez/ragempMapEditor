const player = mp.players.local;

const keysMapEditor = {
    R: 0x52, // CHANGE MODE
    Enter: 0x0D, // FINISH
    alt_izq: 0x12, // FLOOR
    Back: 0x08, // CANCEL
};

const keyMovement = {
    Left: 0x25,
    UP: 0x26,
    Right: 0x27,
    Down: 0x28,
    PageUp: 0x21,
    PageDown: 0x22,
    Shift: 0x10,
};

const mapTitleChat = '!{#4dd374}[MAP_EDITOR]!{#FFFFFF}';

var objectMap = null;
var cameraMap = null;
var labelMap = null;
var intervalMap = null;

const MODE_MOVE = 0;
const MODE_ROT = 1;

const ROT_XYZ = 5;

var modeMapEditor = MODE_MOVE;

//

mp.events.add('iniciarMapa', (objectName) => {
    if(objectMap != null) return;

    mp.gui.chat.push(`${mapTitleChat} Has empezado a mapear un objeto.`);

    //

    const forwardX = player.getForwardX();
    const forwardY = player.getForwardY();

    const pos = new mp.Vector3(player.position.x + forwardX, player.position.y + forwardY, player.position.z);

    objectMap = mp.objects.new(mp.game.joaat(objectName), pos, 
    { 
        rotation: new mp.Vector3(0.0, 0.0, player.heading), 
        alpha: 255, 
        dimension: 0
    });

    //

    setupEditarObjeto();
});

mp.events.add('editarMapaObject', (objRemoteId) => {

    objectMap = mp.objects.atRemoteId(objRemoteId);
    if(objectMap == null) return mp.events.callRemote('cancelMapServer');

    //

    setupEditarObjeto();
});

function moverObjeto() {
    if(objectMap == null) return;

    var tocaObjeto = false;
    var arrayObject = mp.objects.toArray();

    for(var i = 0; i < arrayObject.length; i++) {
        if(objectMap.handle == arrayObject[i].handle) continue;
        if(objectMap.isTouching(arrayObject[i].handle) == true) {
            mp.game.invoke('0x44A0870B7E92D7C0', objectMap.handle, 80); // SET_ENTITY_ALPHA
            tocaObjeto = true;
            break;
        }
    }

    if(tocaObjeto == false) {
        mp.game.invoke('0x44A0870B7E92D7C0', objectMap.handle, 255); // SET_ENTITY_ALPHA
    }
    
    //

    var pos = { x: 0.0, y: 0.0, z: 0.0 };
    var speed = 1.0;

    const movement = modeMapEditor == MODE_MOVE ? 0.1 : 1.0;

    if(mp.keys.isDown(keyMovement.Shift) === true) {
        speed = 2.0;
    }

    if(mp.keys.isDown(keyMovement.Left) === true) {
        pos.x -= movement;
    }
    if(mp.keys.isDown(keyMovement.Right) === true) {
        pos.x += movement;
    }
    if(mp.keys.isDown(keyMovement.UP) === true) {
        pos.y += movement;
    }
    if(mp.keys.isDown(keyMovement.Down) === true) {
        pos.y -= movement;
    }
    if(mp.keys.isDown(keyMovement.PageUp) === true) {
        pos.z += movement;
    }
    if(mp.keys.isDown(keyMovement.PageDown) === true) {
        pos.z -= movement;
    }

    pos.x *= speed;
    pos.y *= speed;
    pos.z *= speed;

    if(modeMapEditor == MODE_MOVE) {
        const obj = objectMap.getCoords(true);
        const label = labelMap.position;
    
        objectMap.setCoords(obj.x + pos.x, obj.y + pos.y, obj.z + pos.z, true, false, false, false);
        labelMap.position = new mp.Vector3(label.x + pos.x, label.y + pos.y, label.z + pos.z);

    } else {
        const obj = objectMap.getRotation(ROT_XYZ);
        objectMap.setRotation(obj.x + pos.y, obj.y + pos.z, obj.z + pos.x, ROT_XYZ, true);
    }
}

// TECLAS

mp.keys.bind(keysMapEditor.alt_izq, true, function() {
    if(objectMap == null) return;

    mp.gui.chat.push(`${mapTitleChat} Colocado en la posición del suelo.`);
    objectMap.placeOnGroundProperly();

    const obj = objectMap.getCoords(true);
    const objeto = mp.game.gameplay.getModelDimensions(objectMap.getModel());

    labelMap.position = new mp.Vector3(obj.x, obj.y, obj.z + objeto.max.z / 2);
});

mp.keys.bind(keysMapEditor.Enter, true, function() {
    if(objectMap == null || mp.game.invoke('0x5A47B3B5E63E94C6', objectMap.handle) != 255) return;
    mp.gui.chat.push(`${mapTitleChat} Terminado de colocar.`);

    mp.events.callRemote('finishMapServer', JSON.stringify({
        model: objectMap.model, 
        pos: objectMap.getCoords(true),
        rot: objectMap.getRotation(5)
    }));
    terminarEdicicion();
});

mp.keys.bind(keysMapEditor.Back, true, function() {
    if(objectMap == null) return;

    mp.gui.chat.push(`${mapTitleChat} Objeto cancelado.`);

    mp.events.callRemote('cancelMapServer');
    terminarEdicicion();
});

mp.keys.bind(keysMapEditor.R, true, function() {
    if(objectMap == null) return;

    if(modeMapEditor == MODE_MOVE) {
        modeMapEditor = MODE_ROT;
        mp.gui.chat.push(`${mapTitleChat} Cambiado a modo !{#ff3636}ROTACIÓN`);

    } else {
        modeMapEditor = MODE_MOVE;
        mp.gui.chat.push(`${mapTitleChat} Cambiado a modo !{#ff3636}MOVIMIENTO`);
    }
});

// UTILS

function setupEditarObjeto() {

    player.freezePosition(true);
    player.setAlpha(0);

    modeMapEditor = MODE_MOVE;

    //

    setTimeout(() => {

        const obj = objectMap.getCoords(true);

        const forwardX = objectMap.getForwardX();
        const forwardY = objectMap.getForwardY();

        cameraMap = mp.cameras.new('mapEditor_camera', new mp.Vector3(obj.x - forwardX * 2.0, obj.y - forwardY * 2.0, obj.z + 3.0), new mp.Vector3(0, 0, 0), 40);

        //cameraMap.pointAt(objectMap.handle, 0.0, 0.0, 0.0, true);
        cameraMap.attachTo(objectMap.handle, forwardX * -3.0, forwardY * -3.0, 1.5, true);
        
        cameraMap.setActive(true);
        mp.game.cam.renderScriptCams(true, true, 1000, true, false);

        //

        const objeto = mp.game.gameplay.getModelDimensions(objectMap.model);
        labelMap = mp.labels.new("EDITANDO", new mp.Vector3(obj.x, obj.y, obj.z + objeto.max.z), { los: false, font: 0, drawDistance: 20, });

        intervalMap = setInterval(moverObjeto, 50);

    }, 200);
}

function terminarEdicicion() {
    objectMap.destroy();
    objectMap = null;
    
    cameraMap.destroy();
    mp.game.cam.renderScriptCams(false, true, 1000, true, false);
    
    labelMap.destroy();
    labelMap = null;
    
    clearInterval(intervalMap);

    //

    player.freezePosition(false);
    player.resetAlpha();
}