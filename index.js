var config = require("./config.js"); 
var mqtt = require("mqtt"); 
let lib = require('./dist/index');
const RoboVac = lib.RoboVac;

let robovac_settings = {
localKey: config.local_key,
deviceId: config.device_id
}
var client = mqtt.connect(config.mqtturl, config.mqttoptions)

client.on('connect', function () {
    topics = [];
    topics.push(config.base_topic+'vacuum/command')
    topics.push(config.base_topic+'vacuum/set_fan_speed')
    console.log(topics)
    client.subscribe(topics);
})

client.on('message', function (topic, message) {
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
            r.setWorkMode('Spot')
          break;
    }
});

const r = new RoboVac(robovac_settings)
let overall_statep = {}
let getStatus = async function () {
    //let r = new RoboVac(robovac_settings);
    await r.getStatuses()
    let dps = r.statuses['dps']
    let statep = {}
    if(dps['104'] != 'undefined' )
        statep.battery_level = r.statuses['dps']['104']
    if(dps['1'] != 'undefined' )
        statep.docked = r.statuses['dps']['1']
    if(dps['5'] != 'undefined' )
        statep.fan_speed = r.statuses['dps']['5']
    if(dps['106'] != 'undefined' )
        statep.error = r.statuses['dps']['106']
    if(dps['15'] != 'undefined' )
        statep.cleaning = r.statuses['dps']['15']


    statep.state = 'idle'
    console.log(dps)
    if(dps['15'] == 'Recharge') {
      statep.state = 'returning'
    } else if(dps['103']) {
      statep.state = 'idle' // locating
    }  else if(dps['2']) {
      statep.state = 'paused'
    } else if(dps['15'] == 'Running') {
      statep.state = 'cleaning' 
    } else if(dps['15'] == 'Charging') {
      statep.state = 'docked'
    } else if(dps['106'] != 'no_error' ) {
      statep.state = 'error'
    }
    Object.keys(statep).forEach(key => {
      if (statep[key] === undefined) {
         delete statep[key];
      }
    });
    console.log(overall_statep)
    let a = Object.assign(overall_statep, statep)
    overall_statep = a
    client.publish(config.base_topic+'vacuum/state', JSON.stringify(overall_statep), {retain: true})

};
setInterval(getStatus,3000)
function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
}