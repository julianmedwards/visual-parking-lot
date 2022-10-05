'use strict'

import {Car} from './car.mjs'

/**
 *
 * @class
 * @param {pathObject} pathObject
 * @param {RoutePlotter} routePlotter
 * @param {Overlay} overlay
 * @param {Object} rankedSpaceList
 * @param {AnimationHandler} animationHandler
 * @property {TrafficHandler} trafficHandler
 * @property {number} carCount - Number of cars so far. Used for car IDs.
 * @property {Object} cars
 * @property {Object} cars.entering - Cars which haven't parked yet.
 * @property {Object} cars.parked - Cars which are currently parked.
 * @property {Object} cars.leaving - Cars which are leaving the lot.
 * @property {Object} cars.left - Cars which have left the lot and scene.
 * @property {Object} intersections
 */
function ParkingLot(
    pathObject,
    routePlotter,
    overlay,
    animationHandler,
    rankedSpaceList
) {
    this.pathObject = pathObject
    this.routePlotter = routePlotter
    this.overlay = overlay
    this.spaces = rankedSpaceList
    this.animationHandler = animationHandler

    this.carCount = 0
    this.cars = {
        entering: {},
        parked: {},
        leaving: {},
        left: {},
    }

    this.spawnCarCooldown = false
}

ParkingLot.prototype.simulate = function () {
    if (!this.spawnCarCooldown && this.trafficHandler.isEntranceClear(this)) {
        this.spawnCar(this.carCount)
        this.spawnCarCooldown = true
        setTimeout(() => {
            this.spawnCarCooldown = false
        }, 10000)
    }

    for (let car in this.cars.leaving) {
        this.cars.leaving[car].determineAction()
    }
    for (let car in this.cars.entering) {
        this.cars.entering[car].determineAction()
    }
    for (let car in this.cars.parked) {
        this.cars.parked[car].determineAction()
    }
}

ParkingLot.prototype.initializeIntersections = function () {
    // Intersections are currently defined manually.
    // It's assumed all intersections are on the ends of horizontal
    // sections.
    let horizontalSections = this.pathObject.sections.horizontal

    this.intersections =
        this.trafficHandler.getIntersections(horizontalSections)

    this.overlay.createIntersectionOverlay(this.intersections)
}

ParkingLot.prototype.spawnCar = function () {
    let assignedSpace = this.getHighestRankedSpace()
    if (assignedSpace) {
        let id = this.carCount
        this.carCount += 1

        let newCar = new Car(id, this)

        assignedSpace.reserved = true
        this.overlay.updateSpaceColor(assignedSpace.pageEl, newCar)
        newCar.initialize(assignedSpace)

        this.cars.entering[id] = newCar
    } else {
        console.log('No spaces available.')
        this.spawnCarCooldown = true
        setTimeout(() => {
            this.spawnCarCooldown = false
        }, 5000)
    }
}

ParkingLot.prototype.requestRouteToSpace = function (car) {
    let start = {
        section: car.currentSection,
        direction: car.direction,
    }

    if (start.section.horizontal) {
        start.coord = car.coords.x
    } else {
        start.coord = car.coords.y
    }

    let destination = {}
    destination.section = car.assignedSpace.section
    if (destination.section.horizontal) {
        destination.coord = car.assignedSpace.x
    } else {
        destination.coord = car.assignedSpace.y
    }

    let route = this.routePlotter.createRoute(
        this.routePlotter,
        start,
        destination
    )

    // Adjust to always make destination.coord the far side of a space.
    destination = route[route.length - 1]
    if (destination.direction === 'south') {
        destination.coord += car.assignedSpace.height
    } else if (destination.direction === 'east') {
        destination.coord += car.assignedSpace.width
    }

    return route
}
ParkingLot.prototype.requestRouteFromSpace = function (car) {
    // Vars:
    // Previous route end coord (space's far edge along section)
    // car.currentSection
    // previous direction & current direction (space direction)
    // Axis
    // negation (which is opposite to what reversing will be)
    // endVals

    let start = {
        section: car.assignedSpace.section,
    }

    start = this.determineSpaceExitLocation(car, start)

    // Testing
    if (start === null) {
        console.log('Exceptional reverse situation, unhandled.')
        return
    } else if (start === undefined) {
        console.error('Unexpected undefined start after determining direction.')
        return
    }
    //

    let destinationSection = this.pathObject.exit
    let destination = {
        section: destinationSection,
        direction: 'south',
        coord: destinationSection.y + destinationSection.len,
    }

    return this.routePlotter.createRoute(this.routePlotter, start, destination)
}
// Most likely move to another object.
ParkingLot.prototype.determineSpaceExitLocation = function (car, start) {
    switch (car.direction) {
        // Check if cars are close enough to the edge to need to make
        // a special maneuver.
        case 'east':
            if (car.route[car.route.length - 1].coord <= 228) {
                // Pull out south then turn east
                // Change coord and section itself
                return null
            } else if (car.route[car.route.length - 1].coord >= 783) {
                // Pull out north then turn east
                // Change coord and section itself
                return null
            }
            break
        case 'west':
            if (car.route[car.route.length - 1].coord <= 228) {
                // Pull out south then west then turn south
                // Change coord and section itself
                return null
            }
            break
    }

    switch (car.direction) {
        // All horizontal cars pull out west to head east.
        case 'north':
        case 'south':
            start.direction = 'east'
            break
        // all right column cars pull out north

        case 'east':
            start.direction = 'south'
            break
        // Left column - Give normal coord (maybe adjust for turn?)
        // and check what the nextSection is, N/S (horizontal)

        // middle section cars will pull out north (onto its own section)
        // top section will pull out north (onto its own section)
        // bottom section will pull out south (onto its own section)
        case 'west':
            // Only the top of the three bottom section spaces
            // will pull out North.
            if (car.assignedSpace.section.row === 2) {
                start.direction = 'north'
            } else {
                start.direction = 'south'
            }
            break
    }

    return start
}

ParkingLot.prototype.getHighestRankedSpace = function () {
    for (let space of this.spaces) {
        if (!space.reserved) {
            return space
        }
    }
}

export {ParkingLot}
