import {
  LitElement,
  html,
  css
} from "./lib/lit-element.js";


class SabikCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      loadingStates: { type: Object },
      fanMenuOpen: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.loadingStates = {};
    this.fanMenuOpen = false;
    this._onDocumentClick = this._onDocumentClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocumentClick);
    super.disconnectedCallback();
  }

  // Close the fan menu when clicking anywhere outside of it
  _onDocumentClick() {
    if (this.fanMenuOpen) {
      this.fanMenuOpen = false;
    }
  }

  // Helper method to show loading state
  setLoading(control, duration = 2000) {
    this.loadingStates = {
      ...this.loadingStates,
      [control]: true
    };
    this.requestUpdate();

    setTimeout(() => {
      this.loadingStates = {
        ...this.loadingStates,
        [control]: false
      };
      this.requestUpdate();
    }, duration);
  }

  // Add click handlers for controls
  handleFanClick(e) {
    // Keep the click from reaching the document listener that closes the menu
    e.stopPropagation();
    this.fanMenuOpen = !this.fanMenuOpen;
  }

  handleFanSelect(e, mode) {
    e.stopPropagation();
    this.fanMenuOpen = false;
    this.setLoading('fan');

    const fanModeMap = {
      '0': 'low',
      '1': 'medium',
      '2': 'high',
      '3': 'auto'
    };

    this.hass.callService('mqtt', 'publish', {
      topic: 'homeassistant/climate/sabik/fan_mode/set',
      payload: fanModeMap[mode]
    });
  }

  handleSnoozeClick() {
    this.setLoading('snooze');
    const isSnooze = this.hass.states['sensor.sabik_current_work_mode'].state === 'snooze';

    this.hass.callService('mqtt', 'publish', {
      topic: 'homeassistant/climate/sabik/mode/set',
      payload: isSnooze ? 'auto' : 'off'
    });
  }

  handleBoostClick() {
    this.setLoading('boost');
    const isBoostActive = this.hass.states['binary_sensor.sabik_boost_status'].state === 'on';

    this.hass.callService('mqtt', 'publish', {
      topic: 'homeassistant/climate/sabik/boost/set',
      payload: isBoostActive ? 'OFF' : 'ON'
    });
  }

  handleBypassClick() {
    this.setLoading('bypass');
    const currentState = this.hass.states['sensor.sabik_bypass_valve_position'].state;

    this.hass.callService('mqtt', 'publish', {
      topic: 'homeassistant/climate/sabik/bypass/set',
      payload: currentState === 'open' ? 'OFF' : 'ON'
    });
  }

  handleSummerModeClick() {
    this.setLoading('summer');
    const currentState = this.hass.states['binary_sensor.sabik_summer_mode'].state;

    this.hass.callService('mqtt', 'publish', {
      topic: 'homeassistant/climate/sabik/summer_mode/set',
      payload: currentState === 'on' ? 'OFF' : 'ON'
    });
  }

  render() {
    const currentMode = this.hass.states['sensor.sabik_selected_air_volume'].state;
    return html`
    <ha-card>
    <div class="container">
      <div class="bg">
          <div class="flex-container">
              <div class="flex-col-out">
                  <div>${this.hass.states['sensor.sabik_outdoor_air_temperature'].state}°C <ha-icon icon="mdi:water-percent"></ha-icon>${this.hass.states['sensor.sabik_rh_outdoor_air'].state}%</div>
                  <div class="fan-state"><ha-icon icon="mdi:speedometer"></ha-icon> ${Math.trunc(this.hass.states['sensor.sabik_rpm_supply_motor'].state)} rpm</div>
                  <div>${this.hass.states['sensor.sabik_exhaust_air_temperature'].state}°C <ha-icon icon="mdi:water-percent"></ha-icon>${this.hass.states['sensor.sabik_rh_exhaust_air'].state}%</div>
                  <div class="fan-state"><ha-icon icon="mdi:speedometer"></ha-icon> ${Math.trunc(this.hass.states['sensor.sabik_rpm_extract_motor'].state)} rpm</div>
              </div>
              <div class="flex-col-main">
                  <div>${this.hass.states['sensor.itho_wpu_current_room_temp'].state}°C</div>
                  <div>
                    <span class="fan-picker">
                      <ha-icon
                        class="clickable ${this.loadingStates.fan ? 'loading' : ''}"
                        @click=${this.handleFanClick}
                        icon="mdi:${({
                          '3': 'fan-auto',
                          '4': 'fan-off',
                          '0': 'fan-speed-1',
                          '1': 'fan-speed-2',
                          '2': 'fan-speed-3'
                        }[currentMode])}">
                      </ha-icon>
                      ${this.getFanMenuTmpl(currentMode)}
                    </span>
                    <ha-icon
                      class="${({'off': 'inactive', 'on': 'active'}[this.hass.states['binary_sensor.sabik_boost_status'].state])} clickable ${this.loadingStates.boost ? 'loading' : ''}"
                      @click=${this.handleBoostClick}
                      icon="mdi:weather-dust">
                    </ha-icon>
                  </div>
              </div>
              <div class="flex-col-in">
                  <div>${this.hass.states['sensor.sabik_extract_air_temperature'].state}°C <ha-icon icon="mdi:water-percent"></ha-icon>${this.hass.states['sensor.sabik_rh_extract_air'].state}%</div>
                  <div class="fan-state"><ha-icon icon="mdi:fan"></ha-icon> ${Math.trunc(this.hass.states['sensor.sabik_voltage_extract_motor'].state)}%</div>
                  <div>${this.hass.states['sensor.sabik_supply_air_temperature'].state}°C <ha-icon icon="mdi:water-percent"></ha-icon>${this.hass.states['sensor.sabik_rh_supply_air'].state}%</div>
                  <div class="fan-state"><ha-icon icon="mdi:fan"></ha-icon> ${Math.trunc(this.hass.states['sensor.sabik_voltage_supply_motor'].state)}%</div>
              </div>
          </div>
      </div>
      </div>
      <div class="info-row">
      ${this.getFanTmpl()}
      ${this.getAirFilterTmpl()}
      ${this.getBypassTmpl()}
      ${this.getPreHeatTmpl()}
      ${this.getSummerModeTmpl()}
      </div>
    </ha-card>
    `;
  }

  getFanMenuTmpl(currentMode){
    if (!this.fanMenuOpen) {
      return html``;
    }

    const options = [
      { mode: '0', icon: 'fan-speed-1' },  // low
      { mode: '1', icon: 'fan-speed-2' },  // medium
      { mode: '2', icon: 'fan-speed-3' },  // high
      { mode: '3', icon: 'fan-auto' }      // auto
    ];

    return html`
      <span class="fan-menu" @click=${(e) => e.stopPropagation()}>
        ${options.map((o) => html`
          <ha-icon
            class="clickable ${currentMode === o.mode ? 'active' : ''}"
            @click=${(e) => this.handleFanSelect(e, o.mode)}
            icon="mdi:${o.icon}">
          </ha-icon>`)}
      </span>`;
  }

  getFanTmpl(){
    const isSnooze = this.hass.states['sensor.sabik_current_work_mode'].state === 'snooze';
    const hasAlarm = this.hass.states['binary_sensor.sabik_extract_fan_alarm'].state === 'on';

    return html`
      <ha-icon
        class="${[
          'clickable',
          this.loadingStates.snooze ? 'loading' : '',
          hasAlarm ? 'alarm' : '',
          isSnooze ? 'active' : 'inactive'
        ].filter(Boolean).join(' ')}"
        @click=${this.handleSnoozeClick}
        icon="mdi:${isSnooze ? 'sleep' : 'fan'}">
      </ha-icon>`;
  }

  getAirFilterTmpl(){
    if(this.hass.states['binary_sensor.sabik_filter_alarm'].state == 'on'){
      return html`<ha-icon class="warning" icon="mdi:air-filter"></ha-icon>`;
    }else{
      return html`<ha-icon class="inactive" icon="mdi:air-filter"></ha-icon>`;
    }
  }

  getBypassTmpl(){
    const currentState = this.hass.states['sensor.sabik_bypass_valve_position'].state;
    const outdoorTemp = parseFloat(this.hass.states['sensor.sabik_outdoor_air_temperature'].state);
    const extractTemp = parseFloat(this.hass.states['sensor.sabik_extract_air_temperature'].state);
    const tempDiff = extractTemp - outdoorTemp;

    // Get the actual limits from the Sabik unit with correct sensor names
    const minOutdoorTemp = parseFloat(this.hass.states['sensor.sabik_min_outdoor_temperature_for_bypass'].state);
    const minExtractTemp = parseFloat(this.hass.states['sensor.sabik_min_extract_temperature_for_bypass'].state);
    const minTempDiff = parseFloat(this.hass.states['sensor.sabik_min_temperature_difference_for_bypass'].state);

    const conditions = [];
    if (outdoorTemp < minOutdoorTemp) {
      conditions.push(`Outdoor temp too low (${outdoorTemp}°C < ${minOutdoorTemp}°C)`);
    }
    if (extractTemp < minExtractTemp) {
      conditions.push(`Indoor temp too low (${extractTemp}°C < ${minExtractTemp}°C)`);
    }
    if (tempDiff < minTempDiff) {
      conditions.push(`Temperature difference too small (${tempDiff.toFixed(1)}°C < ${minTempDiff}°C)`);
    }

    const tooltip = conditions.length > 0
      ? `Cannot enable bypass:\n${conditions.join('\n')}`
      : `Bypass ${currentState === 'open' ? 'active' : 'inactive'}\nOutdoor: ${outdoorTemp}°C\nIndoor: ${extractTemp}°C\nDiff: ${tempDiff.toFixed(1)}°C`;

    return html`
      <div class="tooltip">
        <ha-icon
          class="${[
            'clickable',
            this.loadingStates.bypass ? 'loading' : '',
            currentState !== 'open' ? 'inactive' : '',
            conditions.length > 0 ? 'disabled' : ''
          ].filter(Boolean).join(' ')}"
          @click=${this.handleBypassClick}
          icon="mdi:electric-switch">
        </ha-icon>
        <span class="tooltiptext">${tooltip}</span>
      </div>`;
  }

  getPreHeatTmpl(){
    if(this.hass.states['sensor.sabik_defrost_status'].state != 'inactive'){
      return html`<ha-icon icon="mdi:radiator"></ha-icon>`;
    }else{
      return html`<ha-icon class="inactive" icon="mdi:radiator"></ha-icon>`;
    }
  }

  getSummerModeTmpl(){
    const currentState = this.hass.states['binary_sensor.sabik_summer_mode'].state;
    const outdoorTemp = parseFloat(this.hass.states['sensor.sabik_outdoor_air_temperature'].state);
    const minOutdoorTemp = parseFloat(this.hass.states['sensor.sabik_min_outdoor_temperature_for_bypass'].state);

    const canEnable = outdoorTemp >= minOutdoorTemp;
    const tooltip = canEnable
      ? `Summer mode ${currentState === 'on' ? 'active' : 'inactive'}\nOutdoor temp: ${outdoorTemp}°C`
      : `Cannot enable summer mode:\nOutdoor temp too low (${outdoorTemp}°C < ${minOutdoorTemp}°C)`;

    return html`
      <div class="tooltip">
        <ha-icon
          class="${[
            'clickable',
            this.loadingStates.summer ? 'loading' : '',
            currentState === 'on' ? 'inactive' : '',
            !canEnable ? 'disabled' : ''
          ].filter(Boolean).join(' ')}"
          @click=${this.handleSummerModeClick}
          icon="mdi:${currentState === 'on' ? 'weather-sunny' : 'snowflake'}">
        </ha-icon>
        <span class="tooltiptext">${tooltip}</span>
      </div>`;
  }

  setConfig(config) {
    this.config = config;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 7;
  }

  static get styles() {
    return css`
    .container {
      padding: 10px;
    }
    .bg {
      background-image: url(/local/lovelace-sabik/sabik_heat.png);
      height: 200px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position-y: center
    }
    .not-found {
    background-color: yellow;
    font-family: sans-serif;
    font-size: 14px;
    padding: 8px;
    }
    .flex-container {
        display: flex;
        justify-content: space-between;
        height: 100%;
    }
    .flex-col-main {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30px 0px;
      font-size: x-large;
      text-align: center;
      font-weight:bold;
    }
    .flex-col-out {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .flex-col-in {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .fan-state {
      padding-top: 15px;
    }
    .fan-picker {
      position: relative;
      display: inline-block;
    }
    .fan-menu {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 6px;
      display: flex;
      gap: 10px;
      padding: 8px 12px;
      background-color: rgba(0, 0, 0, 0.9);
      border-radius: 6px;
      z-index: 2;
    }
    .fan-menu ha-icon {
      opacity: 0.7;
    }
    .fan-menu ha-icon:hover {
      opacity: 1;
    }
    .fan-menu ha-icon.active {
      opacity: 1;
    }
    .info-row {
      background: rgba(0,0,0,0.2);
      margin-top: 10px;
      padding: 5px;
      border-top: rgba(0,0,0,0.4);
      -webkit-box-shadow: 0px -4px 3px rgba(50, 50, 50, 0.75);
      -moz-box-shadow: 0px -4px 3px rgba(50, 50, 50, 0.75);
      box-shadow: 0px -2.5px 3px rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: space-around;
    }

    .inactive {
      opacity: 0.5;
    }

    .warning {
      color: #d80707db;
    }

    .clickable {
      cursor: pointer;
    }

    .clickable:hover {
      opacity: 0.8;
    }

    .loading {
      opacity: 0.5;
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .loading {
      animation: pulse 1s infinite;
    }

    .alarm {
      color: #d80707db;
    }

    .alarm.inactive {
      opacity: 1;
      color: #d80707db;
    }

    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .disabled:hover {
      opacity: 0.5;
    }

    /* Tooltip container */
    .tooltip {
      position: relative;
      display: inline-block;
    }

    /* Tooltip text */
    .tooltip .tooltiptext {
      visibility: hidden;
      background-color: rgba(0, 0, 0, 0.9);
      color: #fff;
      text-align: left;
      padding: 8px 12px;
      border-radius: 6px;
      white-space: pre-line;
      font-size: 14px;
      min-width: 200px;
      max-width: 250px;

      /* Position the tooltip */
      position: absolute;
      z-index: 1;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);

      /* Fade in */
      opacity: 0;
      transition: opacity 0.3s;
    }

    /* Show the tooltip text when hovering */
    .tooltip:hover .tooltiptext {
      visibility: visible;
      opacity: 1;
    }

    /* Arrow */
    .tooltip .tooltiptext::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
    }

    .active {
      opacity: 1;
      color: var(--primary-color, #03a9f4);
    }
    `;
  }
}
customElements.define("sabik-card", SabikCard);
