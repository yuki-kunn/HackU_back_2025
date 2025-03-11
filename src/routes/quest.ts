import { Hono } from 'hono'
import type { Quest } from '../types/index.ts'

const questRouter = new Hono()

let quests: Quest[] = []
let idCounter = 1

// クエスト全件取得
questRouter.get('/', (c) => {
  return c.json(quests)
})

// クエスト追加
questRouter.post('/', async (c) => {
  const body = await c.req.json<Pick<Quest, 'title' | 'steps' | 'reward'>>()
  const newQuest = {
    id: idCounter++,
    ...body
  }
  quests.push(newQuest)
  return c.json(newQuest, 201)
})

// クエスト更新
questRouter.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Partial<Quest>>()

  const quest = quests.find((q) => q.id === id)
  if (!quest) return c.json({ error: 'Quest not found' }, 404)

  Object.assign(quest, body)
  return c.json(quest)
})

// クエスト削除
questRouter.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  quests = quests.filter((q) => q.id !== id)
  return c.json({ message: 'Quest deleted' })
})

export default questRouter