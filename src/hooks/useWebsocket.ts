import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux";
import { RootState } from "../store";


const useWebsocket = (shouldConnect: boolean = false)=>{
    const [connect, setConnect] = useState(shouldConnect)
    const {connectionInfo} = useSelector((state: RootState)=>state.connection)
    const socket = useRef<WebSocket>(connect ? new WebSocket(`ws://${connectionInfo.ip_address}:${connectionInfo.port}/ws`) : null);

    useEffect(()=>{
        if (connect) socket.current = new WebSocket(`ws://${connectionInfo.ip_address}:${connectionInfo.port}/ws`)
        else socket.current = null
    }, [connect])


    return {socket, setConnect}
}

export default useWebsocket