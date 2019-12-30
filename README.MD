# Basic support - Haven't even attempted fan mode or any other features


Hass config
```
vacuum:
  - platform: mqtt
    name: "VAC"
    schema: state
    supported_features:
      - start
      - pause
      - stop
      - return_home
      - battery
      - status
      - locate
    command_topic: "VAC/vacuum/command"
    state_topic: "VAC/vacuum/state"

```


`npm i`

`cp ./config.json.dist ./config.json`

update config.json with your values

`node ./index.js`

Should be containerable