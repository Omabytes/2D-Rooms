const canvas = document.getElementById("myCanvas")
const ctx = canvas.getContext("2d")

const CONNECTION_MAP = {
    NRoomID: "SRoomID",
    ERoomID: "WRoomID",
    SRoomID: "NRoomID",
    WRoomID: "ERoomID"
}
const NUM_OF_ROOMS = 12
const STARTING_ROOM_COORDS = {
    topLeftCorner: {
        x: 600,
        y: 300
    },
    bottomRightCorner: {
        x: 700,
        y: 400
    }
}
const ROOM_SEPARATION_DISTANCE = 20

const rooms = []
const roomsWithAvailableConnections = []
let roomCoords = STARTING_ROOM_COORDS
let roomHeight = 100
let roomWidth = 100


let iterations = 0
const generateRooms = setInterval(generateRoom, 500)

function generateRoom() {
    if (rooms.length === 0) {
        const room = createRoomObject(roomCoords, null)
        rooms.push(room)
        roomsWithAvailableConnections.push(room)
        drawRoom(room.topLeftCorner, room.bottomRightCorner)

    } else {
        if (roomsWithAvailableConnections.length === 0) throw "There are no rooms with available connections"
        //todo: Randomly connect adjacent rooms.

        const {item: connectingRoom} = getRandomItemInList(roomsWithAvailableConnections)
        //todo: Allow weighting of choice towards rooms with greater/fewer connections available to give control of sparsity.
        const {item: connectionToUse} = getRandomItemInList(getAvailableConnections(connectingRoom))

        roomCoords = setRoomCoords(connectingRoom, connectionToUse)
        const room = createRoomObject(roomCoords, connectingRoom)
        if (isCollision(room)) return //todo: move above createRoomObject and rework appropriately to use roomCoords.

        setConnectionIDs(room, connectingRoom, connectionToUse)
        rooms.push(room)
        if (roomHasConnectionAvailable(room)) roomsWithAvailableConnections.push(room)
        removeConnectingRoomFromListIfNoMoreConnections(connectingRoom)
        drawRoom(room.topLeftCorner, room.bottomRightCorner)
        drawConnector(room.topLeftCorner, room.bottomRightCorner, connectionToUse)
    }

    iterations++
    if (iterations >= NUM_OF_ROOMS) {
        clearInterval(generateRooms)
    }
}

function drawRoom(TLCorner, BRCorner) {
    const width = BRCorner.x - TLCorner.x
    const height = BRCorner.y - TLCorner.y
    ctx.beginPath()
    ctx.rect(TLCorner.x, TLCorner.y, width, height)
    ctx.strokeStyle = "white"
    ctx.fillStyle = "#bb55ff"
    if (rooms.length === 1) {
        ctx.fillStyle = "#ffff55"
    }
    ctx.stroke()
    ctx.fill()
    ctx.closePath
}

function drawConnector(TLCorner, BRCorner, connectionToUse) {
    let topLeftCoord
    switch (connectionToUse) {
        case "NRoomID":
            topLeftCoord = {
                x: TLCorner.x + ((BRCorner.x - TLCorner.x) / 2) - (ROOM_SEPARATION_DISTANCE / 2),
                y: BRCorner.y
            }
            break;
        case "ERoomID":
            topLeftCoord = {
                x: TLCorner.x - ROOM_SEPARATION_DISTANCE,
                y: TLCorner.y + ((BRCorner.y - TLCorner.y) / 2) - (ROOM_SEPARATION_DISTANCE / 2)
            }
            break;
        case "SRoomID":
            topLeftCoord = {
                x: TLCorner.x + ((BRCorner.x - TLCorner.x) / 2) - (ROOM_SEPARATION_DISTANCE / 2),
                y: TLCorner.y - ROOM_SEPARATION_DISTANCE
            }
            break;
        case "WRoomID":
            topLeftCoord = {
                x: BRCorner.x,
                y: TLCorner.y + ((BRCorner.y - TLCorner.y) / 2) - (ROOM_SEPARATION_DISTANCE / 2)
            }
            break;
        default:
            throw "Room connection to use not specified!"
        }

    const width = ROOM_SEPARATION_DISTANCE
    const height = ROOM_SEPARATION_DISTANCE
    ctx.beginPath()
    ctx.rect(topLeftCoord.x, topLeftCoord.y, width, height)
    ctx.strokeStyle = "white"
    ctx.fillStyle = "#ffffff"
    ctx.stroke()
    ctx.fill()
    ctx.closePath
}

function createRoomObject(coords) {
    return {
        UUID: generateUUIDv4(),
        topLeftCorner: {
            x: coords.topLeftCorner.x,
            y: coords.topLeftCorner.y
        },
        bottomRightCorner: {
            x: coords.bottomRightCorner.x,
            y: coords.bottomRightCorner.y
        },
        connections: {
            NRoomID: null,
            ERoomID: null,
            SRoomID: null,
            WRoomID: null 
        }
        
    }
}

function isCollision(nr) {
    for(const r of roomsWithAvailableConnections) {
        if (((nr.topLeftCorner.x < r.bottomRightCorner.x)
                && (r.topLeftCorner.x < nr.bottomRightCorner.x))
            && ((nr.topLeftCorner.y < r.bottomRightCorner.y)
                && (r.topLeftCorner.y < nr.bottomRightCorner.y))            
        ) {
            return true
        }
    }
    return false
}

function setConnectionIDs(newRoom, connectingRoom, connectionToUse) {
    newRoom.connections[CONNECTION_MAP[connectionToUse]] = connectingRoom.UUID
    connectingRoom.connections[connectionToUse] = newRoom.UUID
}

function roomHasConnectionAvailable(room){
    let bool = false
    for (const k in room.connections) {
        if (room.connections[k] === null) {
            bool = true
            break
        }
    }
    return bool
}

function getAvailableConnections(room) {
    const availableConnections = []
    Object.keys(room.connections).forEach(k => {
        if (room.connections[k] === null) availableConnections.push(k) 
    })
    return availableConnections
}

function setRoomCoords(connectingRoom, connectionToUse) {
    let coords
    switch (connectionToUse) {
        case "NRoomID":
            coords = {
                topLeftCorner: {
                    x: connectingRoom.topLeftCorner.x,
                    y: connectingRoom.topLeftCorner.y - ROOM_SEPARATION_DISTANCE - roomHeight
                },
                bottomRightCorner: {
                    x: connectingRoom.bottomRightCorner.x,
                    y: connectingRoom.topLeftCorner.y - ROOM_SEPARATION_DISTANCE
                }
            }
            break;
        case "ERoomID":
            coords = {
                topLeftCorner: {
                    x: connectingRoom.bottomRightCorner.x + ROOM_SEPARATION_DISTANCE,
                    y: connectingRoom.topLeftCorner.y
                },
                bottomRightCorner: {
                    x: connectingRoom.bottomRightCorner.x + ROOM_SEPARATION_DISTANCE + roomWidth,
                    y: connectingRoom.bottomRightCorner.y
                }
            }
            break;
        case "SRoomID":
            coords = {
                topLeftCorner: {
                    x: connectingRoom.topLeftCorner.x,
                    y: connectingRoom.bottomRightCorner.y + ROOM_SEPARATION_DISTANCE
                },
                bottomRightCorner: {
                    x: connectingRoom.bottomRightCorner.x,
                    y: connectingRoom.bottomRightCorner.y + ROOM_SEPARATION_DISTANCE + roomHeight
                }
            }
            break;
        case "WRoomID":
            coords = {
                topLeftCorner: {
                    x: connectingRoom.topLeftCorner.x - ROOM_SEPARATION_DISTANCE - roomWidth,
                    y: connectingRoom.topLeftCorner.y
                },
                bottomRightCorner: {
                    x: connectingRoom.topLeftCorner.x - ROOM_SEPARATION_DISTANCE,
                    y: connectingRoom.bottomRightCorner.y
                }
            }
            break;
        default:
            throw "Room connection to use not specified!"
    }

    return coords
}

function removeConnectingRoomFromListIfNoMoreConnections(room) {
    if (!roomHasConnectionAvailable(room)) {
        roomsWithAvailableConnections.splice(roomsWithAvailableConnections.find(r => r.UUID === room.UUID), 1)
    }
}

function getRandomItemInList(list) {
    const randomIndex = getRandomNumber(0, list.length)
    return {
        item: list[randomIndex],
        index: randomIndex
    }
}

function getRandomNumber(lowerBound, upperBound) {
    return Math.floor(Math.random() * (upperBound - lowerBound)) + lowerBound
}

function generateUUIDv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}