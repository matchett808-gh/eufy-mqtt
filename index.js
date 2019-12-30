var config = require("./config.json"); 
var mqtt = require("mqtt"); 
let lib = require('eufy-robovac');
const RoboVac = lib.RoboVac;

let robovacSettings = {
    deviceId: config.device_id,
    localKey: config.local_key
};
const r = new RoboVac(robovacSettings);
var client = mqtt.connect(config.mqtturl, config.mqttoptions);

client.on('connect', () => {
    let topics = [];
    topics.push(config.base_topic+'vacuum/command');
    topics.push(config.base_topic+'vacuum/set_fan_speed');
    client.subscribe(topics);
});

client.on('message', (topic, message) => {
    switch(message.toString()) {
    case('locate'):
        r.setFindRobot();
        break;
    case('pause'):
        r.pause();
        break;
    case('start'):
        r.startCleaning();
        break;
    case('return_to_base'):
        r.goHome();
        break;
    case('clean_spot'):
        r.setWorkMode('Spot');
        break;
    default:
        throw new Error('Unrecognized command');
    }
});

let retainedValues = {};

// eslint-disable-next-line
async function getStatus () {
                await r.getStatuses();
                let dps = r.statuses.dps;
                let statep = {};
                if(dps['104'] !== 'undefined' ) { 
                  // eslint-disable-next-line
                  statep.battery_level = r.statuses.dps['104']; 
                }
                if(dps['1'] !== 'undefined' ) { statep.docked = r.statuses.dps['1']; }
                if(dps['5'] !== 'undefined' ) { 
                  // eslint-disable-next-line
                  statep.fan_speed = r.statuses.dps['5']; 
                }
                if(dps['106'] !== 'undefined' ) { statep.error = r.statuses.dps['106']; }
                if(dps['15'] !== 'undefined' ) { statep.cleaning = r.statuses.dps['15']; }


                if(dps['15'] === 'Recharge') {
                    statep.state = 'returning';
                } else if(dps['103']) {
                    statep.state = 'idle'; 
                }  else if(dps['2']) {
                    statep.state = 'paused';
                } else if(dps['15'] === 'Running') {
                    statep.state = 'cleaning'; 
                } else if(dps['15'] === 'Charging') {
                    statep.state = 'docked';
                } else if(dps['106'] !== 'no_error' && dps['106']) {
                    statep.state = 'error';
                }
                Object.keys(statep).forEach((key) => {
                    if (statep[key] === undefined) {
                        delete statep[key];
                    }
                });
                let a = Object.assign(retainedValues, statep);
                retainedValues = a;
                if ( (! retainedValues.state)) {
                    retainedValues.state = 'idle';
                }
                client.publish(config.base_topic+'vacuum/state', JSON.stringify(retainedValues), {retain: true});

}
setInterval(getStatus,3000);