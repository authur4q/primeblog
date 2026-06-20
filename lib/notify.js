import connectMongoDb from "../lib/mongodb"
import Notification from "../models/Notification"
import User from "../models/user"

export const triggerSystemNotification = async ({ type, title, message, targetLink }) => {
  try {
    await connectMongoDb()

    const admins = await User.find({ role: "admin" }).select("_id").lean()
    if (!admins.length) return

    const notificationPayloads = admins.map(admin => ({
      recipient: admin._id,
      type,
      title,
      message,
      targetLink
    }))

    await Notification.insertMany(notificationPayloads)
  } catch (error) {
    console.error("Background notification broadcasting failed:", error)
  }
}