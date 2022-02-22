import SideBar from "./components/SideBar";
import VideoStream from "./components/VideoStream";
import { AlgorithmsData } from "./Algorithms";

function App() {
    return (
        <div className="App flex w-full h-screen">
            <SideBar data={AlgorithmsData} />
            <VideoStream />
        </div>
    );
}

export default App;
