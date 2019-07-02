import React, {useRef, useState} from 'react';
import PropTypes from "prop-types";
import Select from "react-select";
import { IoIosSave } from "react-icons/io";

/* not sure how to do the following in CSS, as the current webpack
transforms mangle all the CSS classnames */
const customReactSelectStyles = {
  option: (provided) => ({
    ...provided,
    color: 'black',
    fontWeight: 600
  })
};

const ArticConfigSelection = ({items, setter, choice}) => (
  <div className="selectDropdown">
    <Select
      placeholder="Select ARTIC premade config:"
      options={[{label: "Remove selection", value: undefined}, ...items]}
      styles={customReactSelectStyles}
      value={choice}
      onChange={(selection) => setter(selection)}
    />
  </div>
);


/**
 * Handler for dropped files (e.g. FASTA / JSON) to read and store as a string
 * using the provided `setter`.
 * @param {DataTransfer} file
 * @param {string} type
 * @param {function} setter
 */
const handleDroppedFile = (file, type, setter) => {
  const fileNameLower = file.name.toLowerCase() || file.toLowerCase();
  if (
    (type === "refFASTA" && !(fileNameLower.endsWith(".fasta") || fileNameLower.endsWith(".fas") || fileNameLower.endsWith(".mfa"))) ||
    (type === "refJSON" && !fileNameLower.endsWith(".json"))
  ) {
    console.error(`Dropped file ${file.name} has incorrect extension`);
    return;
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    setter(event.target.result);
  };
  reader.onerror = function (event) {
    console.error("Error reading reference FASTA")
    setter(false);
  }
  reader.readAsText(file);
}

const SaveConfig = ({handleClick}) => (
  <button className="modernButton" onClick={handleClick}>
    <div><IoIosSave/><span>save config</span></div>
  </button>
)


const Config = ({config, setConfig, socket, closeSidebar}) => {
  const refPanelChooser = useRef();
  const [refPanelDropperHover, setRefPanelDropperHover] = useState(false);
  const [refPanelFileDropped, setRefPanelFileDropped] = useState(undefined);
  const refConfigChooser = useRef();
  const [refConfigDropperHover, setRefConfigDropperHover] = useState(false);
  const [refConfigFileDropped, setRefConfigFileDropped] = useState(undefined);
  const [refConfigArticSelection, setRefConfigArticSelection] = useState(undefined);

  /* data checks to avoid trying to render things before it's appropriate */
  if (!Object.keys(config).length) {
    return (
      <p>Can't display config before we get one from the server!</p>
    );
  }

  const submit = () => {
    console.log("sending new config to server")
    setRefPanelFileDropped(false);
    setRefConfigFileDropped(false);
    const dataForServer = {config, refFasta: refPanelFileDropped, refJsonString: refConfigFileDropped};
    if (refConfigArticSelection) {
      dataForServer.refJsonPath = refConfigArticSelection.value;
    }
    socket.emit('config', dataForServer);
    closeSidebar();
  }

  return (
    <div className="config" onDrop={(e) => {e.preventDefault()}}>

      <h1>Set Config</h1>
      <p style={{maxWidth: "600px"}}>
        {`This panel allows you to modify settings related to how the data is processed and interpreted.
        If you haven't set a mapping reference or panel these should be set now!
        Barcodes detected from the demuxed reads will be displayed here and you can assign them sample names.
        Assigning multiple barcodes the same sample name will collapse the reads from thos barcodes.`}
      </p>
      <p>Click "save config" when you've made modifications</p>

      <SaveConfig handleClick={submit}/>

      <h2>Experiment Title</h2>
      <label>
        <input
          type="text"
          className="wide"
          value={config.title}
          onChange={(event) => {setConfig(Object.assign({}, config, {title: event.target.value}))}}
        />
      </label>

      <h2>Reference Config (JSON)</h2>
      {config.reference ? (
        <div>{`Reference: ${config.reference.label}, ${config.reference.length}bp. This cannot be changed.`}</div>
      ) : refConfigFileDropped ? (
          <div>File loaded -- click submit!</div>
        ) : (refConfigArticSelection && refConfigArticSelection.value) ? (
          <ArticConfigSelection items={config.exampleConfigPaths} setter={setRefConfigArticSelection} choice={refConfigArticSelection}/>
          ) : (
            <div>
              <ArticConfigSelection items={config.exampleConfigPaths} setter={setRefConfigArticSelection} choice={refConfigArticSelection}/>
              <div
                className={`fileDropZone ${refConfigDropperHover ? "dragging" : ""}`}
                onDragEnterCapture={() => setRefConfigDropperHover(true)}
                onDragOver={(e) => {e.preventDefault()}}
                onDragExitCapture={() => setRefConfigDropperHover(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setRefPanelDropperHover(false);
                  handleDroppedFile(e.dataTransfer.files[0], "refFasta", setRefConfigFileDropped);
                }}
              >
                drop JSON here
              </div>
              <button className="modernButton" onClick={() => refConfigChooser.current.click()}>
                choose file
              </button>
              <input
                className="hidden"
                type='file'
                ref={refConfigChooser}
                onChange={(e) => {handleDroppedFile(e.target.files[0], "refJSON", setRefConfigFileDropped);}}
              />
            </div>
          )
      }

      <h2>Reference Panel (FASTA)</h2>
      {config.referencePanel.length ? (
        <div>{`Set, with ${config.referencePanel.length} references. You cannot change this!`}</div>
      ) : refPanelFileDropped ? (
          <div>File loaded -- click submit!</div>
        ) : (
          <div>
            <div
              className={`fileDropZone ${refPanelDropperHover ? "dragging" : ""}`}
              onDragEnterCapture={() => setRefPanelDropperHover(true)}
              onDragOver={(e) => {e.preventDefault()}}
              onDragExitCapture={() => setRefPanelDropperHover(false)}
              onDrop={(e) => {
                e.preventDefault();
                setRefPanelDropperHover(false);
                handleDroppedFile(e.dataTransfer.files[0], "refFASTA", setRefPanelFileDropped);
              }}
            >
              drop FASTA here
            </div>
            <button className="modernButton" onClick={() => refPanelChooser.current.click()}>
              choose file
            </button>
            <input
              className="hidden"
              type='file'
              ref={refPanelChooser}
              onChange={(e) => {handleDroppedFile(e.target.files[0], "refFasta", setRefPanelFileDropped);}}
            />
          </div>
        )
      }

      <h2>Barcodes</h2>
      {Object.keys(config.barcodeToName)
        .sort((a, b) => config.barcodeToName[a].order > config.barcodeToName[b].order ? 1 : -1)
        .map((barcodeName) => {
          return (
            <label key={barcodeName}>
              <div className={"bcLabel"}>
                {`${barcodeName}`}
              </div>
              <input
                type="text"
                value={config.barcodeToName[barcodeName].name}
                onChange={(event) => {
                  const barcodeToName = config.barcodeToName;
                  barcodeToName[barcodeName].name = event.target.value;
                  setConfig(Object.assign({}, config, {barcodeToName}));
                }}
              />
              {/* TODO -- add ordering box / dragger here */}
            </label>
          );
      })}


      <SaveConfig handleClick={submit}/>

    </div>
  )
}

Config.propTypes = {
  config: PropTypes.object.isRequired,
  setConfig: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired
};


export default Config;
