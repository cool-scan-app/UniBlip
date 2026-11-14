import { db } from '../prisma/db.js'

const getAllUsers = async () => {
  const users = await db.orm.public.users.all()
  return users
}

const getUserById = async (id: number) => {
  const user = await db.orm.public.users.where({ id }).first()
  return user
}

export { getAllUsers, getUserById }