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
        if (connect) socket.current = new WebSocket(`ws://${connectionInfo.ip_address}:${connectionInfo.port}/ws`)
    }, [connect])


    return {socket, setConnect}
}

export default useWebsocket