require('dotenv').config()
import {v1 as api} from 'codio-api-js'
import _ from 'lodash'

// hardcoded values
let courseId = 'courseId'
let snowDayStart = new Date('yyyy-mm-ddThh:mm:ss')
let snowDayStop = new Date('yyyy-mm-ddThh:mm:ss')
let shiftDays = 2
let shiftHours = 12
let shiftMinutes = 0


const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

function applyEnv() {
  courseId = process.env['COURSE_ID'] || courseId
  if (process.env['SNOW_DAY_START']) {
    snowDayStart = new Date(process.env['SNOW_DAY_START']) || snowDayStart
  }
  if (process.env['SNOW_DAY_STOP']) {
    snowDayStop = new Date(process.env['SNOW_DAY_STOP']) || snowDayStop
  }
  const _shiftDays = _.toNumber(process.env['SHIFT_DAYS'])
  const _shiftHours = _.toNumber(process.env['SHIFT_HOURS'])
  const _shiftMinutes = _.toNumber(process.env['SHIFT_MINUTES'])
  if (!_.isNaN(_shiftDays)) {
    shiftDays = _shiftDays
  }
  if (!_.isNaN(_shiftHours)) {
    shiftHours = _shiftHours
  }
  if (!_.isNaN(_shiftMinutes)) {
    shiftMinutes = _shiftMinutes
  }
}

function adjustDate(date: Date): boolean {
  if (date < snowDayStop && date > snowDayStart) {
    date.setDate(date.getDate() + shiftDays)
    date.setHours(date.getHours() + shiftHours)
    date.setMinutes(date.getMinutes() + shiftMinutes)
    return true
  }
  return false
}

async function main() {
  applyEnv()
  await api.auth(clientId, secret)

  const course = await api.course.info(courseId)
  for (const assignment of course.assignments) {
    const settings = await api.assignment.getSettings(courseId, assignment.id)
    if (!settings.endTime) {
      continue
    }
    console.log(settings)
    let modified = adjustDate(settings.endTime)
    const penalties = settings.penalties || []
    for (const penalty of penalties) {
      if (!penalty.datetime) {
        continue
      }
      modified = adjustDate(penalty.datetime) || modified
    }
    if (modified) {
      console.log(`Updating ${assignment.id}`, settings)
      await api.assignment.updateSettings(courseId, assignment.id, settings)
    }
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
