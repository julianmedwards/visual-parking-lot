'use strict'

/**
 * @class
 * @typedef {Object} Car
 * @param {number} id
 * @property {string} img
 * @property {Object} coords
 * @property {number} coords.x
 * @property {number} coords.y
 * @property {string} direction
 * @property {number} orientation - Angle of page element's rotation.
 * @property {Boolean} parked
 */
function Car(id, trafficHandler) {
    this.id = id
    this.trafficHandler = trafficHandler

    this.img = undefined
    this.pageEl = undefined
    this.coords = {x: undefined, y: undefined}
    this.currentSection = undefined
    this.direction = undefined
    this.orientation = undefined

    this.assignedSpace = undefined
    this.status = undefined
    this.route = undefined
    this.nextRoutePartition = undefined
    this.parkingDuration = undefined

    this.currSpeed = 0
    this.maxSpeed = undefined
    this.acceleration = undefined
}

Car.prototype.images = [
    'img/car/car-aqua.png',
    'img/car/car-blue.png',
    'img/car/car-dragon.png',
    'img/car/car-green.png',
    'img/car/car-grey.png',
    'img/car/car-hot-pink.png',
    'img/car/car-lime-green.png',
    'img/car/car-orange.png',
    'img/car/car-pink.png',
    'img/car/car-purple.png',
    'img/car/car-red-stripes.png',
    'img/car/car-red.png',
    'img/car/car-white.png',
    'img/car/car-yellow.png',
]

Car.prototype.getRandomImage = function () {
    let rand = Math.floor(Math.random() * this.images.length - 1)
    let img = this.images[rand]
    return img
}

Car.prototype.createPageElement = function () {
    let carWrapper = document.createElement('div')
    carWrapper.classList.add('car')
    carWrapper.id = this.id
    carWrapper.style.left = this.coords.x + 'px'
    carWrapper.style.top = this.coords.y + 'px'
    carWrapper.style.transform = 'rotate(' + this.orientation + 'deg)'

    let imgEl = document.createElement('img')
    imgEl.src = this.img
    carWrapper.append(imgEl)

    document.getElementById('parking-lot').append(carWrapper)

    return carWrapper
}

Car.prototype.initialize = function (parkingLot, assignedSpace) {
    this.img = this.getRandomImage()
    this.coords = {x: 275, y: 1035}
    this.currentSection = parkingLot.pathObject.entrance
    this.direction = 'north'
    this.orientation = 270
    this.width = 90
    this.height = 182
    this.assignedSpace = assignedSpace
    this.parked = false
    this.status = 'parking'

    this.pageEl = this.createPageElement()

    this.route = parkingLot.requestRoute(this)
    this.parkingDuration = 15000

    this.speed = 0
    this.maxSpeed = 20
}

Car.prototype.determineAction = function (parkingLot) {
    switch (this.status) {
        case 'parking':
        case 'leaving':
            this.moveAlongRoute()
            break
        case 'parked':
            setTimeout(() => {
                parkingLot.requestRoute(this)
                this.status = leaving
            }, this.parkingDuration)
    }
}

Car.prototype.moveAlongRoute = function () {
    // if (!this.nextRoutePartition) {
    //     this.nextRoutePartition = this.determineNextRoutePartition()
    // }

    // this.nextRoutePartition

    this.moveForward()
}

// Car.prototype.determineNextRoutePartition = function () {}

Car.prototype.wait = function () {}
Car.prototype.moveForward = function () {
    let directionVars = this.getDirectionVars()
    let axis = directionVars.axis,
        symbol = directionVars.symbol,
        negation = directionVars.negation

    // Check remaining distance to end goal first.
    let oneCarAhead = {
        x: this.coords.x,
        y: this.coords.y,
        w: this.width,
        h: this.height,
    }
    oneCarAhead[symbol] = this.coords[symbol] + this.height * negation
    let isOneCarLengthAheadOccupied = this.checkAhead(oneCarAhead)

    let newSpeed
    if (isOneCarLengthAheadOccupied !== []) {
        this.returnDistanceBetween()
        newSpeed = this.calcDeceleration()
        this.advance(symbol, axis, negation, newSpeed)
        return
    }

    newSpeed = this.calcAcceleration()
    let minStoppingDistance = newSpeed * 3
    let minDistanceAhead = {
        x: this.coords.x,
        y: this.coords.y,
        w: this.width,
        h: this.height,
    }
    minDistanceAhead[symbol] =
        this.coords[symbol] + minStoppingDistance * negation

    let isMinStoppingDistanceOccupied = checkAhead(minDistanceAhead)
    if (isMinStoppingDistanceOccupied !== []) {
        this.returnDistanceBetween()
        newSpeed = this.calcDeceleration()
        this.advance(symbol, axis, negation, newSpeed)
        return
    }

    this.advance(symbol, axis, negation, newSpeed)
}
Car.prototype.advance = function (symbol, axis, negation, newSpeed) {
    this.speed = newSpeed
    this.coords[symbol] = this.coords[symbol] + this.speed * negation
    this.pageEl.style[axis] = this.coords[symbol] + 'px'
}
Car.prototype.turn = function () {}
Car.prototype.reverseOutOfSpace = function () {}
Car.prototype.park = function () {}
Car.prototype.exitScene = function () {}

Car.prototype.getDirectionVars = function () {
    let axis, symbol
    let negation = 1
    if (this.direction === 'north' || this.direction === 'south') {
        axis = 'top'
        symbol = 'y'
        if (this.direction === 'north') {
            negation = -1
        }
    } else {
        axis = 'left'
        symbol = 'x'
        if (this.direction === 'west') {
            negation = -1
        }
    }

    return {axis: axis, symbol: symbol, negation: negation}
}
Car.prototype.checkAhead = function (areaAhead) {
    let carsAhead = this.trafficHandler.returnCarsInArea(areaAhead)
    return carsAhead
}
Car.prototype.returnDistanceBetween = function () {}

Car.prototype.calcAcceleration = function () {
    let acceleratedSpeed = this.speed + this.maxSpeed / 10
    if (acceleratedSpeed > this.maxSpeed) {
        acceleratedSpeed = this.maxSpeed
    }
    return acceleratedSpeed
}
Car.prototype.calcDeceleration = function (stoppingDistance) {
    let deceleratedSpeed = this.speed / stoppingDistance / 2

    return deceleratedSpeed
}

export {Car}
