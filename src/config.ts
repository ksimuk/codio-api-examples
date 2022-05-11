require('dotenv').config()
import codio from 'codio-api-js'
import _ from 'lodash'
import { Penalty } from 'codio-api-js/lib/lib/assignment'
const api = codio.v1

const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

// hardcoded values
const courseId = process.env['COURSE_ID'] || 'courseId'

function setDate(date: Date, shiftDays = 0, shiftHours = 0, shiftMinutes = 0): Date {
  const res = new Date(date);
  res.setDate(res.getDate() + shiftDays)
  res.setHours(res.getHours() + shiftHours)
  res.setMinutes(res.getMinutes() + shiftMinutes)
  return res
}

async function main() {
  await api.auth(clientId, secret)

  const course = await api.course.info(courseId)
  for (const assignment of course.assignments) {
    const settings = await api.assignment.getSettings(courseId, assignment.id)
    if (!settings.endTime) {
      continue
    }
    const penalties: Penalty[] = []
    if (assignment.name.startsWith('Homework:')) { 
      // Homework can be up to 3 days late with a 10% penalty and up to 7 days late with a 30% penalty

      penalties.push({
        id: 1,
        percent: 10,
        datetime: setDate(settings.endTime, -10),
        message: '10%'
      })
      penalties.push({
        id: 1,
        percent: 30,
        datetime: setDate(settings.endTime, -7),
        message: '30%'
      })
    } else if (assignment.name.startsWith('Labs:')) {
      // Labs can be up to 3 days late with a 5% penalty for every 12 hours the submission is late
      const range = _.range(-3 * 24, 0, 12)
      let percent = 5
      let i = 1
      for (const shift of range) {
        penalties.push({
          id: i,
          percent,
          datetime: setDate(settings.endTime, shift),
          message: `${percent}%`
        })
        i++
        percent += 5
      }
    } else if (assignment.name.startsWith('Project:')) {
      // Projects can be up to 1 day late with a 1% penalty for every hour the submission is late
      const range = _.range(-24, 0, 1)
      let percent = 1
      let i = 1
      for (const shift of range) {
        penalties.push({
          id: i,
          percent,
          datetime: setDate(settings.endTime, shift),
          message: `${percent}%`
        })
        i++
        percent += 1
      }
    }
    await api.assignment.updateSettings(courseId, assignment.id, {penalties})
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
