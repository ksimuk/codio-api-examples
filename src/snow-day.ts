require('dotenv').config()
import codio from 'codio-api-js'
const api = codio.v1

const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

// hardcoded values
const courseId = process.env['COURSE_ID'] || 'courseId'
const snowDayStart = new Date(process.env['SNOW_DAY_START'] || 'yyyy-mm-ddThh:mm:ss')
const snowDayStop = new Date(process.env['SNOW_DAY_STOP'] || 'yyyy-mm-ddThh:mm:ss')
const shiftDays = parseInt(process.env['SHIFT_DAYS'])  || 2
const shiftHours = parseInt(process.env['SHIFT_HOURS']) || 12
const shiftMinutes = parseInt(process.env['SHIFT_MINUTES']) || 0

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
  await api.auth(clientId, secret)

  const course = await api.course.info(courseId)
  for (const assignment of course.assignments) {
    const settings = await api.assignment.getSettings(courseId, assignment.id)
    let modified = adjustDate(settings.endTime)
    for (const penalty of settings.penalties) {
      modified = adjustDate(penalty.datetime) || modified
    }
    if (modified) {
      console.log(`Updating ${assignment.id} ${settings}`)
      await api.assignment.updateSettings(courseId, assignment.id, settings)
    }
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
