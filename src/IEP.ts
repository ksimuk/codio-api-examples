require('dotenv').config()
import codio from 'codio-api-js'
import _ from 'lodash'
const api = codio.v1

const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

// hardcoded values
const courseId = process.env['COURSE_ID'] || 'courseId'
const studentEmail = process.env['EMAIL'] || ''
const multilier = _.toNumber(process.env['MULTIPLIER']) || 1.5

async function main() {
  await api.auth(clientId, secret)

  const students = await api.course.getStudents(courseId)

  const student = _.find(students, {email: studentEmail})
  if (_.isUndefined(student)) {
      throw new Error(`${studentEmail} student not found`)
  }
  const course = await api.course.info(courseId)
  for (const module of course.modules) {
    console.log(`${module.name} :`)
    for (const assignment of module.assignments) {
      const settings = await api.assignment.getSettings(courseId, assignment.id)
      if (!settings.examMode || !settings.examMode.timedExamMode.enabled) { // not an exam
          continue
      }
      const timeLimit = settings.examMode.timedExamMode.duration * multilier
      console.log(`Extend ${assignment.name} for Student ${student.name} timelimit to ${timeLimit} minutes`)
      await api.assignment.updateStudentTimeExtension(courseId, assignment.id, student.id, {
          extendedTimeLimit: timeLimit
      })
    }
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
