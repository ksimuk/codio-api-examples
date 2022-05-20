require('dotenv').config()
import codio from 'codio-api-js'
import _ from 'lodash'
const api = codio.v1

// hardcoded values
const courseId = process.env['COURSE_ID'] || 'courseId'
const studentEmail = process.env['EMAIL'] || ''
let eventDayStart = new Date('yyyy-mm-ddThh:mm:ss')
let eventDayStop = new Date('yyyy-mm-ddThh:mm:ss')
let newDeadLine = new Date('yyyy-mm-ddThh:mm:ss')

const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

function applyEnv() {

  if (process.env['EVENT_DAY_START']) {
    eventDayStart = new Date(process.env['EVENT_DAY_START']) || eventDayStart
  }
  if (process.env['EVENT_DAY_STOP']) {
    eventDayStop = new Date(process.env['EVENT_DAY_STOP']) || eventDayStop
  }
  if (process.env['DEADLINE']) {
    newDeadLine = new Date(process.env['DEADLINE']) || newDeadLine
  }

}

async function main() {
  applyEnv()
  await api.auth(clientId, secret)
  const students = await api.course.getStudents(courseId)

  const student = _.find(students, {email: studentEmail})
  if (_.isUndefined(student)) {
      throw new Error(`${studentEmail} student not found`)
  }
  const course = await api.course.info(courseId)

  for (const assignment of course.assignments) {
    const settings = await api.assignment.getSettings(courseId, assignment.id)
    if (!settings.endTime) {
      continue
    }
    if (settings.endTime < eventDayStop && settings.endTime > eventDayStart) {
      const extension = (newDeadLine.getTime() - settings.endTime.getTime()) / (1000 * 60)
      console.log(`Adjusting ${assignment.name} adding ${extension} minutes`)
      await api.assignment.updateStudentTimeExtension(courseId, assignment.id, student.id, {
        extendedDeadline: extension
      })
    }
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
