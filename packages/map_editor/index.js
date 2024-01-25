const MAP_CREATE = 0;
const MAP_EDITOR = 1;

const GUARDAR_OBJ = true;

const fs = require('fs');
const fileSave = 'map.txt';

// EVENTS

mp.events.add('finishMapServer', (player, datos) => {

    const objeto = JSON.parse(datos);

    if(player.estaMapeando == MAP_CREATE) {
        mp.objects.new(objeto.model, new mp.Vector3(objeto.pos), 
        { 
            rotation: new mp.Vector3(objeto.rot), 
            alpha: 255, 
            dimension: 0
        });

    } else {
        const object = mp.objects.at(player.editandoObjeto);
        if(object) {
            object.position = new mp.Vector3(objeto.pos);
            object.rotation = new mp.Vector3(objeto.rot);
        }
    }

    //

    if(GUARDAR_OBJ == true) {

        var text = `[ '${objeto.model}', ${objeto.pos.x.toFixed(2)}, ${objeto.pos.y.toFixed(2)}, ${objeto.pos.z.toFixed(2)}, `;
        text += `${objeto.rot.x.toFixed(2)}, ${objeto.rot.y.toFixed(2)}, ${objeto.rot.z.toFixed(2)}, ${player.estaMapeando == MAP_CREATE ? 'NUEVO' : 'EDITADO'} ],\r\n`;
	
        player.outputChatBox(text);
    
        fs.appendFile(fileSave, text, err => {
    
            if (err) {
              console.error(err)
              return
            }
        });
    }

    //

    player.estaMapeando = null;
    player.editandoObjeto = null;
});

mp.events.add('cancelMapServer', (player) => {
    player.estaMapeando = null;
});

// COMMAND

mp.events.addCommand('map', (player, _, name) => {
    if(player.estaMapeando != null) return player.outputChatBox(`ERROR: ¡Ya estás mapeando!`);
    
    player.call('iniciarMapa', [name || 'prop_barrier_work01a']);
    player.estaMapeando = MAP_CREATE;
});

mp.events.addCommand('editmap', (player, object) => {
    if(player.estaMapeando != null) return player.outputChatBox(`ERROR: ¡Ya estás mapeando!`);

    if(object == undefined) {

        var arrayObject = mp.objects.toArray();

        for(var i = 0; i < arrayObject.length; i++) {
            player.outputChatBox(`ID: ${arrayObject[i].id} | ${arrayObject[i].model}`);
        }
        return;
    }

    const objectId = parseInt(object);
    if(isNaN(objectId) == true) return player.outputChatBox(`ERROR: ¡Escribe un número!`);
    if(mp.objects.exists(objectId) == false) return player.outputChatBox(`ERROR: ¡No existe ese ID!`);

    player.call('editarMapaObject', [objectId]);
    player.estaMapeando = MAP_EDITOR;
    player.editandoObjeto = objectId;
});