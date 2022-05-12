require('dotenv').config()
import codio from 'codio-api-js'
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
      console.log(`  ${assignment.name} - Due ${settings.endTime?.toLocaleString()}`)
    }
  }
}

main().catch(_ => {
  console.error(_);
  process.exit(1)
})
