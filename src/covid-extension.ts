require('dotenv').config()
import codio from 'codio-api-js'
import { Assignment } from 'codio-api-js/lib/lib/course'
import _ from 'lodash'
const api = codio.v1

const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

// hardcoded values
const courseId = process.env['COURSE_ID'] || 'courseId'
const studentEmail = process.env['EMAIL'] || ''
let moduleName = process.env['MODULE'] || ''
let assignmentNames = process.env['ASSIGNMENTS'] || ''
let shiftDays = 2
let shiftHours = 12
let shiftMinutes = 30

function applyEnv() {
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

async function main() {
  applyEnv()
  await api.auth(clientId, secret)
  const assignments = _.compact(assignmentNames.split(','))
  const students = await api.course.getStudents(courseId)

  const student = _.find(students, {email: studentEmail})
  if (_.isUndefined(student)) {
      throw new Error(`${studentEmail} student not found`)
  }
  const course = await api.course.info(courseId)
  const toExtend: Assignment[] = []
  for (const module of course.modules) {
    if (module.name === moduleName) {
      toExtend.push.apply(module.assignments)
      continue
    }
    for (const assignment of module.assignments) {
      if (assignments.includes(assignment.name)) {
        toExtend.push(assignment)
      }
    }
  }

  const extend = shiftDays * 24 * 60 + shiftHours * 60 + shiftMinutes

  for(const assignment of toExtend) {
    console.log(`Extend ${assignment.name} for Student ${student.name} deadline on ${extend} minutes`)
    await api.assignment.updateStudentTimeExtension(courseId, assignment.id, student.id, {
        extendedDeadline: extend
    })
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
