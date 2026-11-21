import type { Context } from 'hono'
import * as userService from '../services/userService.js'


const getAllUsers = async (c: Context) => {
  const users = await userService.getAllUsers()
  return c.json(users)
}

const getUserById = async (c: Context) => {
    const id = Number(c.req.param('id'))
    const user = await userService.getUserById(id)
    return c.json(user)
}

export { getAllUsers, getUserById }