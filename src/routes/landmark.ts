import { Hono } from 'hono'
import type { Landmark } from '../types/index.ts' 

const landmarkRouter = new Hono()

let landmarks: Landmark[] = []
let idCounter = 1

// ランドマーク全件取得
landmarkRouter.get('/', (c) => {
  return c.json(landmarks)
})

// ランドマーク追加
landmarkRouter.post('/', async (c) => {
  const body = await c.req.json<Pick<Landmark, 'name' | 'location'>>()
  const newLandmark = {
    id: idCounter++,
    ...body,
    isOpen: false
  }
  landmarks.push(newLandmark)
  return c.json(newLandmark, 201)
})

// ランドマーク開放
landmarkRouter.put('/:id/open', (c) => {
  const id = Number(c.req.param('id'))
  const landmark = landmarks.find((lm) => lm.id === id)
  if (!landmark) return c.json({ error: 'Landmark not found' }, 404)

  landmark.isOpen = true
  return c.json(landmark)
})

// ランドマーク削除
landmarkRouter.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  landmarks = landmarks.filter((lm) => lm.id !== id)
  return c.json({ message: 'Landmark deleted' })
})

export default landmarkRouter