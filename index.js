var config = require("./config.json"); 
var mqtt = require("mqtt"); 
let lib = require('eufy-robovac');
const RoboVac = lib.RoboVac;
RoboVac.maxStatusUpdateAge = 1000;
const CleanSpeed = lib.CleanSpeed;
const WorkMode = lib.WorkMode;

let robovacSettings = {
    deviceId: config.device_id,
    localKey: config.local_key
};
if(config.ip) {
    robovacSettings.ip = config.ip
}
const r = new RoboVac(robovacSettings);
var client = mqtt.connect(config.mqtturl, config.mqttoptions);


// eslint-disable-next-line
async function toggleFindRobot () {
                let isFindRobot = await r.getFindRobot();
                r.setFindRobot(!isFindRobot);
}

client.on('connect', () => {
    let topics = [];
    topics.push(config.base_topic+'vacuum/command');
    topics.push(config.base_topic+'vacuum/set_fan_speed');
    client.subscribe(topics);
});

client.on('message', (topic, message) => {
    switch(message.toString()) {
    case('locate'):
        toggleFindRobot();
        break;
    case('pause'):
        r.setPlayPause(false);
        break;
    case('stop'):
        r.setPlayPause(false);
        break;
    case('start'):
        r.startCleaning();
        break;
    case('return_to_base'):
        r.goHome();
        break;
    case('clean_spot'):
        r.setWorkMode(WorkMode.SPOT);
        break;
    case('small_room'):
        r.setWorkMode(WorkMode.SMALL_ROOM);
        break;
    case('auto_mode'):
        r.setWorkMode(WorkMode.AUTO);
        break;
    case('edge_clean'):
        r.setWorkMode(WorkMode.EDGE);
        break;
    case('No Suction'):
        r.setCleanSpeed(CleanSpeed.NO_SUCTION);
        break;
    case('Standard'):
        r.setCleanSpeed(CleanSpeed.STANDARD);
        break;
    case('Boost IQ'):
        r.setCleanSpeed(CleanSpeed.BOOST_IQ);
        break;
    case('Max'):
        r.setCleanSpeed(CleanSpeed.MAX);
        break;

    default:
        throw new Error('Unrecognized command '+message.toString());
    }
});

let retainedValues = {};
// eslint-disable-next-line
async function getStatus () {
                await r.getStatuses(true);
                let dps = r.statuses.dps;
                let statep = {};
                if(dps['104'] !== 'undefined' ) { 
                  // eslint-disable-next-line
                  statep.battery_level = r.statuses.dps['104']; 
                }
                if(dps['1'] !== 'undefined' ) { statep.docked = r.statuses.dps['1']; }
                if(dps['5'] !== 'undefined' ) { 
                  // eslint-disable-next-line
                  statep.fan_speed = r.statuses.dps['102']; 
                }
                if(dps['106'] !== 'undefined' ) { statep.error = r.statuses.dps['106']; }
                if(dps['15'] !== 'undefined' ) { statep.cleaning = r.statuses.dps['15']; }


                if(dps['15'] === 'Recharge' || dps['101'] === 'true') {
                    statep.state = 'returning';
                }  else if(dps['15'] === 'standby' || dps['15'] === 'Sleeping') {
                    statep.state = 'paused';
                } else if(dps['15'] === 'Charging' || dps['15'] === 'completed') {
                    statep.state = 'docked';
                } else if(dps['15'] === 'Running' || dps['5'] !== 'Nosweep') {
                    statep.state = 'cleaning'; 
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