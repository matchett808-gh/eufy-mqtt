# Basic support - Haven't even attempted fan mode or any other features

Fan speed and spot cleaning now works

Hass config
```
vacuum:
  - platform: mqtt
    name: "Effie"
    schema: state
    supported_features:
      - start
      - pause
      - stop
      - return_home
      - battery
      - status
      - locate
      - clean_spot
      - fan_speed
    command_topic: "effie/vacuum/command"
    state_topic: "effie/vacuum/state"
    set_fan_speed_topic: "effie/vacuum/set_fan_speed"
    fan_speed_list:
      - No Suction
      - Standard
      - Boost IQ
      - Max




```


`npm i`

`cp ./config.json.dist ./config.json`

update config.json with your values

`node ./index.js`

Should be containerable