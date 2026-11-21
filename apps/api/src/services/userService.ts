import * as userRepository from '../repositories/userRepository.js'

const getAllUsers = async () => {
  const users = await userRepository.getAllUsers()
  return users
}

const getUserById = async (id: number) => {
  const user = await userRepository.getUserById(id)
  return user
}

export { getAllUsers, getUserById }