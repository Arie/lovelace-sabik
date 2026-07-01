# Homeassistant Lovelace Sabik card

![Image](https://raw.githubusercontent.com/Arie/lovelace-sabik/master/result.png)

[![Install with HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Arie&repository=lovelace-sabik)

# Installation

There are two ways to install this card:

## HACS Installation (Recommended)
1. Make sure you have [HACS](https://hacs.xyz/) installed in your Home Assistant instance
2. Go to HACS → Frontend
3. Click the "+ Explore & Download Repositories" button
4. Search for "Sabik Card"
5. Click Download
6. Restart Home Assistant

## Manual Installation
1. Download the `sabik-card.js` file from this repository (it is fully self-contained — the background image and Lit are bundled in)
2. Copy it to your `config/www/lovelace-sabik/` folder
3. Add the following to your Lovelace resources:
```yaml
resources:
  - type: module
    url: /local/lovelace-sabik/sabik-card.js
```
4. Restart Home Assistant

## Adding the Card to Your Dashboard
1. Go to your dashboard
2. Click the 3 dots menu in the top right and choose 'Edit Dashboard'
3. Click the '+' button to add a new card
4. Scroll down to manually add a card in YAML mode:
```yaml
type: 'custom:sabik-card'
```

## Required Entities

The card expects the following entities to be available:

```yaml
sensor.sabik_outdoor_air_temperature
sensor.sabik_rh_outdoor_air
sensor.sabik_rpm_supply_motor
sensor.sabik_exhaust_air_temperature
sensor.sabik_rh_exhaust_air
sensor.sabik_rpm_extract_motor
sensor.itho_wpu_current_room_temp (replace with your own room temperature sensor)
sensor.sabik_selected_air_volume
binary_sensor.sabik_boost_status
sensor.sabik_extract_air_temperature
sensor.sabik_rh_extract_air
sensor.sabik_voltage_extract_motor
sensor.sabik_supply_air_temperature
sensor.sabik_rh_supply_air
sensor.sabik_voltage_supply_motor
binary_sensor.sabik_extract_fan_alarm
binary_sensor.sabik_filter_alarm
sensor.sabik_bypass_valve_position
sensor.sabik_defrost_status
binary_sensor.sabik_summer_mode
sensor.sabik_current_work_mode
```

## MQTT Topics

The card publishes commands to the following MQTT topics:

```yaml
homeassistant/climate/sabik/fan_mode/set     # For fan speed control
homeassistant/climate/sabik/mode/set         # For snooze mode
homeassistant/climate/sabik/boost/set        # For boost mode
homeassistant/climate/sabik/bypass/set       # For bypass control
homeassistant/climate/sabik/summer_mode/set  # For summer mode
```

## Features

* Display temperatures and humidity levels throughout the system
* Control fan speeds (low/medium/high/auto)
* Toggle boost mode
* Toggle snooze mode
* Control bypass and summer mode with temperature condition feedback
* Monitor filter and fan alarms
* Visual feedback for all system states

