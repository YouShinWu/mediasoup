console.log('test')

const io = require('socket.io-client')
const mediasoupClient = require('mediasoup-client')

const socket = io("/mediasoup")

socket.on('connection-success',({ socketId, existsProducer }) =>{
    console.log(socketId, existsProducer)
})

let device
let rtpCapabilities
let producerTransport
let consumerTransport
let producer
let consumer
let isProducer = false

let params = {
    //mediasoup params
    encoding: [
        {
            rid: 'r0',
            maxBitrate: 100000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r2',
            maxBitrate: 900000,
            scalabilityMode: 'S1T3',
        },
    ],
    codecOptions: {
        videoGoogleStartBitrate: 1000
    }

}


const streamSuccess = (stream) => {
    localVideo.srcObject = stream
    const track = stream.getVideoTracks()[0]
    params = {
        track,
        ...params
    }
    
    goConnect(true)
}

const getLocalStream = () =>{
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: {
                min:  640,
                max: 1920,
            },
            heigh: {
                min: 400,
                max: 1080,
            }
        }
    }).then(streamSuccess)
    .catch(error => {
        console.log(error.message)
    })
}

const goConsume = () => {
    goConnect(false)
}


const goConnect = (producerOrConsumer) => {
    isProducer = producerOrConsumer
    device === undefined ? getRtpCapabilities() : goCreateTransport()
}

const goCreateTransport = () => {
    isProducer ? createSendTransport() : createRecvTransport()
}

const createDevice = async () => {
    try{
        device = new mediasoupClient.Device();
        await device.load({
            routerRtpCapabilities: rtpCapabilities
        })

        console.log('Device RTP Capabilities', rtpCapabilities) // That device knows about allowed codecs

        goCreateTransport()

    }catch(error){
        console.log(error)
        if (error.name === 'UnsupportedError'){
            console.warn('Browser not supported')
        }
    }
}

const getRtpCapabilities = () => {
    // make a request to the server for Router RTP Cpapbilities
    // see server's socket.on('getRtpCapabilities', ...)
    // the server sends back data object which contains rtpCapabilities

    socket.emit('createRoom', (data) => {
        console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)

        rtpCapabilities = data.rtpCapabilities

        //once we have rtpCapabilities from the Router, create Device
        createDevice()
    })
}

const createSendTransport = () => {
    socket.emit('createWebRtcTransport', { sender:true }, ({ params }) => {
        if(params.error){
            console.log(params.error)
            return
        }
        console.log(params) 
        
        producerTransport = device.createSendTransport(params)

        producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) =>{
            try{
                // signal local DTLS parameters to the server side transport
                await socket.emit('transport-connect',{
                    // transportId: producerTransport.id,
                    dtlsParameters: dtlsParameters,
                })

            // Tell the transport that parameters were transmitted.
            callback()

            }catch(error){
                errback(error)
            }
        })

        producerTransport.on('produce', async(parameters, callback, errback) =>{
            console.log(parameters)
            try {
                await socket.emit('transport-produce',{
                    // transportId: producerTransport.id,
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                }, ({ id })=>{
                    // Tell the transport that parameters were transmitted and provide it will the
                    // server side producer's id.
                    callback({ id })
                })
            }catch(error){
                errback(error)
            }
        })

        connectSendTransport()
    })

}

const connectSendTransport = async () => {
    
    producer = await producerTransport.produce(params)

    producer.on('trackended', () => {
        console.log('track end')
            
            // close video track
    })

    producer.on('transportclose', () => {
        console.log('transport ended')
    })
}

const createRecvTransport = async () => {
    await socket.emit('createWebRtcTransport', { sender: false }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }

        console.log(params);

        // creat the recv transport
        consumerTransport = device.createRecvTransport(params)

        consumerTransport.on('connect', async ( { dtlsParameters }, callback, errback) => {
            try{
                await socket.emit('transport-recv-connect', {
                    // transportId: consumerTransport.id,
                    dtlsParameters,
                })

                // Tell the transport that parameters were transmitted
                callback()
            }catch(error){
                // Tell the transport that somthing was wrong.
                errback(error)
            }
        })

        connectRecvTransport()
    })
}

const connectRecvTransport = async () => {
    await socket.emit('consume', {
        rtpCapabilities: device.rtpCapabilities,
    }, async({ params }) => {
        if(params.error){
            console.log('Cannt Consum')
            return
        }

        console.log(params)
        consumer = await consumerTransport.consume({
            id: params.id,
            producerId: params.producerId,
            kind: params.kind,
            rtpParameters: params.rtpParameters
        })

        const { track } = consumer

        remoteVideo.srcObject = new MediaStream([track])

        socket.emit('consumer-resume')
    })
}


const btnLocalVideo = document.getElementById('btnLocalVideo')
const btnRecvSendTransport = document.getElementById('btnRecvSendTransport')


btnLocalVideo.addEventListener("click", getLocalStream)
btnRecvSendTransport.addEventListener('click', goConsume)