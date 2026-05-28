/**
 * Generates ITM report question HTML for nfpa25-itm-report template.
 * Run: node scripts/generate-itm-report-template.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/templates/pdf/components/itm-report-content.html");

/** @param {string} id @param {string} label */
function qRow(id, label) {
  const slug = id.toUpperCase();
  return `
  <div class="question-row">
    <div class="question-text">${label}</div>
    <div class="yna-options">
      <label><span class="box {{ITM_Q_${slug}_YES}}"></span> Yes</label>
      <label><span class="box {{ITM_Q_${slug}_NO}}"></span> No</label>
      <label><span class="box {{ITM_Q_${slug}_NA}}"></span> NA</label>
    </div>
  </div>`;
}

/** @param {string} title @param {Array<[string, string]>} questions */
function section(title, questions) {
  return `
  <div class="section">
    <h3 class="section-title">${title}</h3>
    ${questions.map(([id, label]) => qRow(id, label)).join("\n")}
  </div>`;
}

const sections = [
  [
    "OWNER SECTION",
    [
      ["owner_building_occupied", "Is the building occupied?"],
      [
        "owner_occupancy_unchanged",
        "Has the occupancy classification, hazard of contents, and/or storage method remained the same since the last inspection?",
      ],
      ["owner_systems_in_service", "Are all fire protection systems in service?"],
      [
        "owner_system_unchanged",
        "Has the system remained in service without modification since the last inspection?",
      ],
      [
        "owner_no_actuations",
        "Was the system free of actuations of devices or alarms since the last inspection?",
      ],
    ],
  ],
  [
    "VALVE AREA",
    [
      [
        "valve_hydraulic_sign",
        "Is Hydraulic Design Information Sign or Pipe Schedule System sign provided, attached securely and legible?",
      ],
      [
        "valve_general_info_sign",
        "Is General Information Sign provided, securely attached and legible?",
      ],
      ["valve_info_sign", "Is the Information Sign attached and legible?"],
      [
        "valve_sealed_position",
        "Are the control valves supervised with seals in correct (open or closed) position?",
      ],
      [
        "valve_sealed_supervision",
        "Are the control valves supervised with seals locked or is supervision in place?",
      ],
      ["valve_sealed_accessible", "Are the control valves supervised with seals accessible?"],
      ["valve_sealed_leaks", "Are the control valves supervised with seals free from leaks?"],
      [
        "valve_sealed_wrenches",
        "Do the control valves supervised with seals have appropriate wrenches?",
      ],
      [
        "valve_sealed_identified",
        "Are the control valves supervised with seals properly identified?",
      ],
      [
        "valve_locked_position",
        "Are the control valves with locks in correct (open or closed) position?",
      ],
      [
        "valve_locked_supervision",
        "Are the control valves with locks locked or is supervision in place?",
      ],
      ["valve_locked_accessible", "Are the control valves with locks accessible?"],
      ["valve_locked_leaks", "Are the control valves with locks free from any leaks?"],
      [
        "valve_locked_wrenches",
        "Do the control valves with locks have the appropriate wrenches?",
      ],
      ["valve_locked_identified", "Are the control valves with locks properly identified?"],
      [
        "valve_elec_position",
        "Are the control valves with electrical supervision in correct (open or closed) position?",
      ],
      [
        "valve_elec_supervision",
        "Are the control valves with electrical supervision locked or is supervision in place?",
      ],
      [
        "valve_elec_accessible",
        "Are the control valves with electrical supervision accessible?",
      ],
      [
        "valve_elec_leaks",
        "Are the control valves with electrical supervision free from any leaks?",
      ],
      [
        "valve_elec_wrenches",
        "Do the control valves with electrical supervision have the appropriate wrenches?",
      ],
      [
        "valve_elec_identified",
        "Are the control valves with electrical supervision properly identified?",
      ],
      [
        "valve_check_valves",
        "Are all check valves externally inspected, operating properly, and are in good condition?",
      ],
      [
        "valve_gauges_pressure",
        "Are the gauges on system showing normal water supply pressure?",
      ],
      [
        "valve_prv_open",
        "Are Pressure reducing valves (sprinkler system) in open position and not leaking?",
      ],
      [
        "valve_prv_downstream",
        "Are Pressure reducing valves (sprinkler system) with downstream pressure per the design?",
      ],
      [
        "valve_prv_condition",
        "Are Pressure reducing valves in good condition including no handwheels broken?",
      ],
      [
        "valve_mechanical_waterflow",
        "Have the mechanical waterflow alarm devices passed tests by opening inspector's test connection/bypass connection with alarms actuating and flow observed?",
      ],
      ["valve_supervisory_switches", "Do valve supervisory switches indicate movement?"],
      [
        "valve_electrical_waterflow",
        "The electrical waterflow alarm devices passed test by opening inspector's test connection/bypass connection with alarms actuating and flow observed?",
      ],
      [
        "valve_post_indicating",
        "Have post indicating valves been opened until spring or torsion felt in the rod and then closed back 1/4 turn?",
      ],
      [
        "valve_full_range",
        "All control valves operated through full range and returned to normal position?",
      ],
      ["valve_prv_partial_flow", "Have pressure reducing valves passed partial flow test?"],
    ],
  ],
  [
    "BACKFLOW PREVENTERS",
    [
      ["backflow_relief_port", "Is relief port on RPZ device not discharging?"],
      ["backflow_forward_flow", "Have backflow devices passed forward flow test?"],
    ],
  ],
  [
    "ALARMS",
    [
      ["alarms_not_damaged", "Are alarms and supervisory devices not damaged?"],
      ["alarms_low_temp", "Do low temperature alarms look ok?"],
    ],
  ],
  [
    "FIRE DEPARTMENT CONNECTION",
    [
      ["fdc_visible", "Is the FDC plainly visible and easily accessible?"],
      ["fdc_accessible", "Is the FDC easily accessible?"],
      ["fdc_swivels", "Are the FDC swivels and couplings not damaged?"],
      ["fdc_caps", "Are the FDC caps and plugs in place and undamaged?"],
      ["fdc_gaskets", "Are the FDC gaskets in place?"],
      ["fdc_check_valve", "Is the FDC check valve free of leaks?"],
      [
        "fdc_clapper_drain",
        "Is the clapper and automatic drain valve in place and properly operating?",
      ],
      ["fdc_signs", "Is the FDC identification sign(s) in place?"],
      [
        "fdc_interior",
        "Has the interior of the FDC been inspected for obstructions?",
      ],
      ["fdc_visible_piping", "Is the visible piping supplying the FDC undamaged?"],
      [
        "fdc_locking_caps",
        "If locking caps/plugs are in place, has an internal inspection been conducted?",
      ],
      [
        "fdc_hydrostatic",
        "Has the fire department connection been hydrostatically tested in the last 5 years?",
      ],
    ],
  ],
  [
    "PIPES",
    [
      [
        "pipes_condition",
        "Are the visible pipe and fittings in good condition with no external corrosion?",
      ],
      [
        "pipes_damage",
        "Do visible pipe and fittings have no mechanical damage or leaks?",
      ],
      ["pipes_external_loads", "Does visible pipe have no external loads?"],
      [
        "pipes_hangers",
        "Are visible pipe hangers and seismic braces not damaged or loose?",
      ],
      ["pipes_freezer", "Is the pipe through freezers free of any ice blockage?"],
      [
        "pipes_internal_assessment",
        "Has an assessment of internal condition of piping been performed in the last 5 years? (If no, conduct assessment)",
      ],
    ],
  ],
  [
    "SPRINKLER HEADS",
    [
      [
        "heads_spare_count",
        "Are there the proper number and type of spare sprinklers with a list in place?",
      ],
      [
        "heads_position",
        "Are visible sprinklers in the proper position: upright, pendent, sidewall?",
      ],
      [
        "heads_corrosion",
        "Are visible sprinklers free of corrosion and physical damage?",
      ],
      ["heads_clearance", "Is there proper clearance below the sprinklers?"],
      [
        "heads_foreign_material",
        "Are visible sprinklers free of foreign materials including foreign paint?",
      ],
      ["heads_glass_bulb", "Is there liquid in all visible glass bulb sprinklers?"],
      ["heads_spare_wrench", "Are there spare sprinklers and a sprinkler wrench?"],
      ["heads_dated", "Are all the sprinklers dated 1920 or later?"],
      [
        "heads_fast_response",
        "Fast response sprinklers 20 or more years old replaced or successfully sample tested within last 10 years?",
      ],
      [
        "heads_standard_50",
        "Standard response sprinklers 50 or more years old replaced or successfully sample tested within last 10 years?",
      ],
      [
        "heads_standard_75",
        "Standard response sprinklers 75 or more years old replaced or successfully sample tested within last 5 years?",
      ],
      [
        "heads_dry_type",
        "Dry-type sprinklers replaced or successfully sample tested within last 10 years?",
      ],
      [
        "heads_harsh_env",
        "Have sprinklers subject to harsh environments been replaced or successfully sample tested in the last 5 years?",
      ],
      [
        "heads_escutcheons",
        "Were missing escutcheons and coverplates for recessed, flush and concealed sprinklers replaced with their listed escutcheon or coverplate?",
      ],
      [
        "heads_list_posted",
        "Is list of the sprinklers installed in the property posted in the sprinkler cabinet?",
      ],
    ],
  ],
  [
    "MAINTENANCE",
    [
      [
        "maint_sample_failed",
        "If a sprinkler failed a sample test, were all the sprinklers represented by that sample replaced?",
      ],
      [
        "maint_proper_replacement",
        "If sprinklers have been replaced, were they proper replacements?",
      ],
      [
        "maint_marine_systems",
        "Were marine systems normally having fresh water drained and refilled twice if raw water got into the system?",
      ],
      [
        "maint_heat_tape",
        "Was heat tape inspected per the manufacturer's instructions?",
      ],
      [
        "maint_flushing",
        "If conditions were found that required flushing, was flushing of the system conducted?",
      ],
      [
        "maint_components_tested",
        "Have adjusted, repaired, reconditioned, or replaced components had proper tests/inspections performed?",
      ],
      [
        "maint_valve_status",
        "Was a valve status test conducted after opening any closed valve?",
      ],
      [
        "maint_osy_lubricated",
        "Operating stem of all OS&amp;Y valves lubricated, completely closed and reopened?",
      ],
      [
        "maint_cooking_sprinklers",
        "Have sprinklers and spray nozzles protecting commercial cooking equipment and ventilating systems been placed annually?",
      ],
      [
        "maint_obstructions",
        "Is the system free of obstructions (e.g. defective intake screen on pump supplied from open sources, obstructive material discharged during flow tests, foreign material in dry-type valves, foreign material in water during drain test or plugging of inspector's test connection, plugging of pipe or sprinklers found, failure to flush yard piping or surrounding mains following new installation or repairs, record of broken mains in the vicinity, abnormal frequent false-tripping of dry valves, system has just been returned to service after more than 1 year, there is a reason to think the system contains sodium silicate or its derivatives or highly corrosive fluxes in copper pipe, raw water was pumped into the fire department connection, pinhole leaks, a 50% increase in time from the original system acceptance test required for water to reach the inspector's test connection during a full flow test)?",
      ],
    ],
  ],
  [
    "WET VALVE",
    [
      [
        "wet_valve_damage",
        "Is the alarm valve and associated trim free from physical damage?",
      ],
      ["wet_valve_trim_position", "Is the trim in correct (open or closed) position?"],
      [
        "wet_valve_leakage",
        "Is there no leakage in the retarding chamber or drains?",
      ],
    ],
  ],
  [
    "VALVE AREA (ENVIRONMENT)",
    [
      [
        "valve_enclosure_temp",
        "Are enclosures around valves maintaining a minimum of 40 degrees F?",
      ],
      ["valve_low_temp_alarms", "Low temperature alarms are in good working condition?"],
      [
        "valve_gauges_condition",
        "Are the gauges on systems with/without low pressure alarms in good condition and showing normal air and water pressure?",
      ],
      [
        "valve_aux_drain_sign",
        "Sign indicating number and location of all auxiliary drains provided?",
      ],
    ],
  ],
  [
    "DRY VALVE",
    [
      [
        "dry_freezer_gauge",
        "For freezer systems, gauge near compressor reading the same as gauge near the dry-pipe valve?",
      ],
      ["dry_valve_damage", "Dry pipe valve(s) free from physical damage?"],
      ["dry_trim_position", "Are trim valves in appropriate (open or closed) position?"],
      ["dry_intermediate_leak", "Is there no leakage in the intermediate chamber?"],
      ["dry_low_temp_test", "Have low temperature alarms passed test?"],
      ["dry_kept_dry", "Are dry-pipe systems kept in dry condition?"],
      ["dry_air_maintenance", "Have automatic air maintenance devices passed test?"],
    ],
  ],
  [
    "MAINTENANCE (DRY)",
    [
      [
        "dry_maint_aux_drains",
        "Have auxiliary drains been emptied (before freezing weather)?",
      ],
      [
        "dry_maint_interior",
        "Is interior of dry-pipe valves cleaned and in good condition?",
      ],
      [
        "dry_maint_low_points",
        "Have low points been drained before freezing weather?",
      ],
    ],
  ],
];

const wet1Section = `
  <div class="section">
    <h3 class="section-title">Report of Inspection / Test for System - Wet 1</h3>
  <div class="subsection">
    <h4 class="subsection-title">INTERNAL PIPE INSPECTION</h4>
    ${qRow("wet1_internal_assessment", "Has system passed internal pipe assessment within last 5 years?")}
    <div class="field-row"><span class="field-label">Date of next 5-year internal pipe assessment?</span> <span class="field-value">{{ITM_WET1_NEXT_ASSESSMENT_DATE}}</span></div>
  </div>
  <div class="subsection">
    <h4 class="subsection-title">MAINTENANCE</h4>
    ${qRow("wet1_gauge_check", "Have gauges been checked by a calibrated gauge or replaced in the last 5 years?")}
  </div>
  </div>`;

const dry1Section = `
  <div class="section">
    <h3 class="section-title">Report of Inspection / Test for System - Dry 1</h3>
    <div class="subsection">
      <h4 class="subsection-title">DRY VALVE TRIP TEST</h4>
      ${qRow("dry1_trip_comparable", "Were results comparable to previous test?")}
      ${qRow("dry1_quick_opening", "Has the quick opening device passed the test?")}
      ${qRow("dry1_low_air_signal", "Has the low air pressure signal passed it's test?")}
      <div class="field-row"><span class="field-label">System pressure when low air pressure signal came in:</span> <span class="field-value">{{ITM_DRY1_LOW_AIR_PRESSURE}}</span></div>
      ${qRow("dry1_full_trip", "Has the dry valve been fully tripped within the last 3 years?")}
    </div>
    <div class="subsection">
      <h4 class="subsection-title">DRY VALVE</h4>
      ${qRow("dry1_priming_level", "Is the priming level correct?")}
      ${qRow("dry1_air_leak_test", "Has the system passed air/gas leak test within the last 3 years?")}
      ${qRow("dry1_gauge_check", "Have gauges been checked by a calibrated gauge or replaced in the last 5 years?")}
    </div>
    <div class="subsection">
      <h4 class="subsection-title">AIR COMPRESSORS</h4>
      ${qRow("dry1_compressor_restore", "Does the compressor restore normal air pressure in the required time frame?")}
      ${qRow("dry1_compressor_damage", "Is the air compressor, piping, wiring free of physical damage?")}
      ${qRow("dry1_compressor_oil", "For oil-filled air compressors, has the oil been replaced or changed per the manufacturer's instructions?")}
      ${qRow("dry1_compressor_anchored", "Is the air compressor anchored properly to the structure or system piping?")}
      ${qRow("dry1_compressor_oil_level", "For oil-filled air compressors, is the level sufficient?")}
      ${qRow("dry1_compressor_operates", "Does the air compressor operate as intended on the proper drop in pressure?")}
      ${qRow("dry1_compressor_overheat", "Does the air compressor operate without overheating?")}
    </div>
    <div class="subsection">
      <h4 class="subsection-title">INTERNAL PIPE INSPECTION</h4>
      ${qRow("dry1_internal_assessment", "Has system passed internal pipe assessment within last 5 years?")}
      <div class="field-row"><span class="field-label">Date of next 5-year internal pipe assessment?</span> <span class="field-value">{{ITM_DRY1_NEXT_ASSESSMENT_DATE}}</span></div>
    </div>
  </div>`;

const tablesHtml = `
  <div class="section page-break-before">
    <h3 class="section-title">DRY VALVE TRIP TEST</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th></th>
          <th>Dry Valve Size</th>
          <th>Year of Mfr.</th>
          <th>Make</th>
          <th>Model</th>
          <th>Serial no.</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td colspan="5">{{ITM_DRY_VALVE_INFO}}</td>
        </tr>
        <tr>
          <td></td>
          <th>Accelerator Year of Mfr.</th>
          <th>Make</th>
          <th>Model</th>
          <th colspan="2">Serial no.</th>
        </tr>
        <tr>
          <td></td>
          <td colspan="5">{{ITM_ACCELERATOR_INFO}}</td>
        </tr>
      </tbody>
    </table>
    <table class="data-table">
      <thead>
        <tr>
          <th></th>
          <th>Time to Trip thru test pipe</th>
          <th>Water Pressure</th>
          <th>Air Pressure</th>
          <th>Trip point air pressure</th>
          <th>Time water reached test outlet</th>
          <th>Alarm Operated</th>
        </tr>
      </thead>
      <tbody>
        {{ITM_DRY_VALVE_TRIP_ROWS}}
      </tbody>
    </table>
    <div class="subsection">
      <h4 class="subsection-title">DRY VALVE TRIP TEST (cont)</h4>
      ${qRow("dry1_trip_comparable_cont", "Were results comparable to previous test?")}
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">MAIN DRAIN FLOW TESTS</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>System</th>
          <th>Initial Static</th>
          <th>Residual Static</th>
          <th>Seconds to Return to Initial Static</th>
          <th>Flow Observed?</th>
          <th>Did waterflow alarm operate?</th>
          <th>Are results comparable to previous test?</th>
        </tr>
      </thead>
      <tbody>
        {{ITM_MAIN_DRAIN_ROWS}}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3 class="section-title">INSPECTORS TEST CONNECTION</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>System</th>
          <th>Location</th>
          <th>Description</th>
          <th>Time to Alarm (seconds)</th>
          <th>Reported?</th>
          <th>Smooth Orifice</th>
          <th>Easily Accessible</th>
          <th>Signs?</th>
          <th>Pass?</th>
        </tr>
      </thead>
      <tbody>
        {{ITM_INSPECTORS_TEST_ROWS}}
      </tbody>
    </table>
  </div>

  <div class="section page-break-before">
    <h3 class="section-title">VALVES</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>System</th>
          <th>Description</th>
          <th>Location</th>
          <th>Valve Type</th>
          <th>Size</th>
          <th>Secured</th>
          <th>Open</th>
          <th>Easily Accessible</th>
          <th>Signs</th>
          <th>Exercised</th>
          <th>Stems Lubricated</th>
          <th># of Turns</th>
        </tr>
      </thead>
      <tbody>
        {{ITM_VALVE_ROWS}}
      </tbody>
    </table>
  </div>`;

const photosDeficienciesHtml = `
  <div class="section page-break-before">
    <h3 class="section-title">Questions with Photos and Notes</h3>
    {{ITM_PHOTOS_NOTES_HTML}}
  </div>

  <div class="section page-break-before">
    <h3 class="section-title">Deficiencies - General Questions</h3>
    {{ITM_DEFICIENCIES_GENERAL_HTML}}
  </div>

  <div class="section">
    <h3 class="section-title">Deficiencies - General Wet System Questions</h3>
    <p class="none-indicator">{{ITM_DEFICIENCIES_WET_GENERAL}}</p>
  </div>

  <div class="section">
    <h3 class="section-title">Deficiencies - General Dry System Questions</h3>
    {{ITM_DEFICIENCIES_DRY_GENERAL_HTML}}
  </div>

  <div class="section">
    <h3 class="section-title">Deficiencies - Wet 1</h3>
    {{ITM_DEFICIENCIES_WET1_HTML}}
  </div>

  <div class="section">
    <h3 class="section-title">Deficiencies - Dry 1</h3>
    {{ITM_DEFICIENCIES_DRY1_HTML}}
  </div>

  <div class="section">
    <h3 class="section-title">Deficiencies - Inspectors Test Connection</h3>
    {{ITM_DEFICIENCIES_INSPECTORS_HTML}}
  </div>

  <div class="section">
    <h3 class="section-title">Deficiencies - Valves</h3>
    <p class="none-indicator">{{ITM_DEFICIENCIES_VALVES}}</p>
  </div>`;

const sampleRows = {
  dryTrip: `<tr><td>Without Accelerator</td><td>17</td><td>60</td><td>15</td><td>22</td><td>62</td><td>Yes</td></tr>
<tr><td>With Accelerator</td><td>N/A</td><td>N/A</td><td>N/A</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>`,
  mainDrain: `<tr><td>Wet 1</td><td>65</td><td>55</td><td>60</td><td>3</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Dry 1</td><td>65</td><td>55</td><td>60</td><td>2</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>`,
  inspectors: `<tr><td>Wet 1 (Wet)</td><td></td><td>VR ITV</td><td></td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Dry 1 (Dry)</td><td>Rear Right corner classroom in ceiling</td><td>End of Lin TV</td><td></td><td>Yes</td><td>No</td><td></td><td></td><td></td></tr>`,
  valves: `<tr><td>Wet 1 (Wet)</td><td>CITY SIDE BACKFLOW</td><td>New Valve 1</td><td>Butterfly</td><td>6"</td><td>Monitored</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>N/A</td></tr>
<tr><td>Wet 1 (Wet)</td><td>SYSTEM SIDE BACKFLOW</td><td>New Valve 2</td><td>Butterfly</td><td>6"</td><td>Monitored</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>N/A</td></tr>
<tr><td>Wet 1 (Wet)</td><td>Wet Riser Control</td><td>VR</td><td>Butterfly</td><td>3"</td><td>Monitored</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>N/A</td></tr>
<tr><td>Dry 1 (Dry)</td><td>Dry control</td><td>Valve room</td><td>Butterfly</td><td>3"</td><td>Monitored</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>N/A</td></tr>`,
  photosNotes: `<div class="photo-note-block">
      <p><strong>Has the interior of the FDC been inspected for obstructions?</strong> Yes</p>
      <p><em>Notes:</em> Suggest flushing during 5 year testing.</p>
      <p class="photo-label">Visit Photos</p>
      {{ITM_VISIT_PHOTOS}}
    </div>`,
  deficienciesGeneral: `<div class="deficiency-block"><h4>Deficiency #1</h4><p>Is Hydraulic Design Information Sign or Pipe Schedule System sign provided, attached securely and legible?: <strong>No</strong></p><p><em>Notes:</em></p></div>
<div class="deficiency-block"><h4>Deficiency #2</h4><p>Have backflow devices passed forward flow test?: <strong>No</strong></p><p><em>Notes:</em> Unknown ask client for clarification</p></div>
<div class="deficiency-block"><h4>Deficiency #3</h4><p>Has the fire department connection been hydrostatically tested in the last 5 years?: <strong>No</strong></p><p><em>Notes:</em> Ask client for clarification.</p></div>
<div class="deficiency-block"><h4>Deficiency #4</h4><p>Has an assessment of internal condition of piping been performed in the last 5 years? (If no, conduct assessment): <strong>No</strong></p><p><em>Notes:</em> Ask client for clarification.</p></div>
<div class="deficiency-block"><h4>Deficiency #5</h4><p>Are there the proper number and type of spare sprinklers with a list in place?: <strong>No</strong></p><p><em>Notes:</em></p></div>
<div class="deficiency-block"><h4>Deficiency #6</h4><p>Are visible sprinklers in the proper position: upright, pendent, sidewall?: <strong>No</strong></p><p><em>Notes:</em> Valve room head is installed upside down.</p>{{ITM_DEFICIENCY_6_PHOTO}}</div>
<div class="deficiency-block"><h4>Deficiency #7</h4><p>Are there spare sprinklers and a sprinkler wrench?: <strong>No</strong></p><p><em>Notes:</em></p></div>
<div class="deficiency-block"><h4>Deficiency #8</h4><p>Is list of the sprinklers installed in the property posted in the sprinkler cabinet?: <strong>No</strong></p><p><em>Notes:</em></p></div>`,
  deficienciesDryGeneral: `<div class="deficiency-block"><h4>Deficiency #9</h4><p>Sign indicating number and location of all auxiliary drains provided?: <strong>No</strong></p><p><em>Notes:</em></p></div>`,
  deficienciesWet1: `<div class="deficiency-block"><h4>Deficiency #10</h4><p><strong>Sprinkler Type:</strong> Wet</p><p>Has system passed internal pipe assessment within last 5 years?: <strong>No</strong></p><p><em>Notes:</em></p></div>
<div class="deficiency-block"><h4>Deficiency #11</h4><p><strong>Sprinkler Type:</strong> Wet</p><p>Have gauges been checked by a calibrated gauge or replaced in the last 5 years?: <strong>No</strong></p><p><em>Notes:</em> 2019</p></div>`,
  deficienciesDry1: `<div class="deficiency-block"><h4>Deficiency #12</h4><p><strong>Sprinkler Type:</strong> Dry</p><p>Has the system passed air/gas leak test within the last 3 years?: <strong>No</strong></p><p><em>Notes:</em></p></div>
<div class="deficiency-block"><h4>Deficiency #13</h4><p><strong>Sprinkler Type:</strong> Dry</p><p>Have gauges been checked by a calibrated gauge or replaced in the last 5 years?: <strong>No</strong></p><p><em>Notes:</em></p></div>
<div class="deficiency-block"><h4>Deficiency #14</h4><p><strong>Sprinkler Type:</strong> Dry</p><p>Has system passed internal pipe assessment within last 5 years?: <strong>No</strong></p><p><em>Notes:</em></p></div>`,
  deficienciesInspectors: `<div class="deficiency-block"><h4>Deficiency #15</h4><p><strong>Location:</strong> Rear Right corner classroom in ceiling</p><p><strong>Description:</strong> End of Lin TV</p><p><strong>Signs:</strong> No</p><p><em>Notes:</em></p></div>`,
};

let bodyHtml = sections.map(([title, questions]) => section(title, questions)).join("\n");
bodyHtml += wet1Section;
bodyHtml += dry1Section;
bodyHtml += tablesHtml.replace("{{ITM_DRY_VALVE_TRIP_ROWS}}", sampleRows.dryTrip)
  .replace("{{ITM_MAIN_DRAIN_ROWS}}", sampleRows.mainDrain)
  .replace("{{ITM_INSPECTORS_TEST_ROWS}}", sampleRows.inspectors)
  .replace("{{ITM_VALVE_ROWS}}", sampleRows.valves);
bodyHtml += photosDeficienciesHtml
  .replace("{{ITM_PHOTOS_NOTES_HTML}}", sampleRows.photosNotes)
  .replace("{{ITM_DEFICIENCIES_GENERAL_HTML}}", sampleRows.deficienciesGeneral)
  .replace("{{ITM_DEFICIENCIES_WET_GENERAL}}", "None")
  .replace("{{ITM_DEFICIENCIES_DRY_GENERAL_HTML}}", sampleRows.deficienciesDryGeneral)
  .replace("{{ITM_DEFICIENCIES_WET1_HTML}}", sampleRows.deficienciesWet1)
  .replace("{{ITM_DEFICIENCIES_DRY1_HTML}}", sampleRows.deficienciesDry1)
  .replace("{{ITM_DEFICIENCIES_INSPECTORS_HTML}}", sampleRows.deficienciesInspectors)
  .replace("{{ITM_DEFICIENCIES_VALVES}}", "None");

const html = `<!-- NFPA 25 ITM Report Content (auto-generated — run scripts/generate-itm-report-template.mjs to regenerate) -->
<div class="itm-report-body">
  <div class="section">
    <h2 class="report-main-title">Report of Inspection / Test General Questions</h2>
  </div>
${bodyHtml}
</div>
`;

writeFileSync(outPath, html.trim() + "\n", "utf-8");
console.log(`Wrote ${outPath} (${html.length} chars)`);
