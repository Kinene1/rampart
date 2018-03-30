import React, { Component } from 'react';
import Header from "./Header";
import Panel from "./Panel"
import LoadingStatus from "./LoadingStatus"
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import { css } from 'glamor'
import { getData } from "../utils/getData"

const container = css({
  display: "flex",
  'flexDirection': 'column'
})

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      status: "App loading"
    };
    this.changeStatus = (status) => {this.setState({status})}
    this.changeData = (data) => {this.setState({data})}
  }

  componentDidMount() {
    getData(this.changeStatus, this.changeData)
  }

  generatePanels() {
    return this.state.data.map((d, i) => (
      <Panel key={i} data={d}/>
    ))
  }

  render() {
    return (
      <div {...container}>
        <Header/>
        {this.state.data.length ?
          this.generatePanels() :
          <LoadingStatus status={this.state.status}/>
        }
      </div>
    )
  }
}

export default App;