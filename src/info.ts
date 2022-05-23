require('dotenv').config()
import codio from 'codio-api-js'
import _ from 'lodash'
const api = codio.v1

const clientId = process.env['CLIENT'] || 'clientId'
const secret = process.env['SECRET'] || 'secret'

// hardcoded values
const courseId = process.env['COURSE_ID'] || 'courseId'

async function main() {
  await api.auth(clientId, secret)

  const course = await api.course.info(courseId)
  for (const module of course.modules) {
    console.log(`${module.name} :`)
    for (const assignment of module.assignments) {
      const settings = await api.assignment.getSettings(courseId, assignment.id)
      let due = settings.endTime ? settings.endTime.toLocaleString() : 'No'
      if (settings.penalties && settings.penalties?.length > 0) {
        due = _.sortBy(settings.penalties, ['datetime'])[0].datetime.toLocaleString()
      }
      console.log(`  ${assignment.name} - Due ${due}`)
    }
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
