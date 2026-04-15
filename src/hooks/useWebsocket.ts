import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";


const useWebsocket = (shouldConnect: boolean = false)=>{
    const [connect, setConnect] = useState(shouldConnect)
    const {connectionInfo} = useSelector((state: RootState)=>state.connection)
    const socket = useRef<WebSocket | null>(null);
    useEffect(()=>{
        if (socket.current){
            socket.current.close()
            socket.current = null
        }
        if (connect) {
            socket.current = new WebSocket(`http://${connectionInfo.ip_address}:${connectionInfo.port}/ws?session=${connectionInfo.session_id}`)
            socket.current.onopen = ()=>console.log("Websocket running")
            socket.current.onerror = ()=>console.log("Websocket error")
        }
    }, [connect])


    return {socket, setConnect}
}

export default useWebsocket