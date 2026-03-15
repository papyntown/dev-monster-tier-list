import { createFileRoute } from '@tanstack/react-router'
import MonsterTierApp from '../components/MonsterTierApp'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <MonsterTierApp />
}
