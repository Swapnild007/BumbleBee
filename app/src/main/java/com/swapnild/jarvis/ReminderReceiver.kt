package com.swapnild.jarvis

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

/**
 * Durable one-shot reminder delivery. Reminder metadata is kept in app-private
 * preferences so Android can restore pending alarms after a device reboot.
 */
internal object ReminderScheduler {
    private const val PREFS = "jarvis_reminders_v1"
    private const val ITEMS = "items"
    private const val CHANNEL_ID = "jarvis_reminders"
    private const val MAX_TEXT = 240

    @Synchronized
    fun schedule(context: Context, reminder: JSONObject) {
        val id = reminder.optString("id").trim()
        val at = reminder.optLong("at", 0L)
        val text = reminder.optString("text", "Reminder").trim().take(MAX_TEXT).ifBlank { "Reminder" }
        val kind = reminder.optString("kind", "Reminder").trim().take(40).ifBlank { "Reminder" }
        require(id.matches(Regex("[A-Za-z0-9_-]{1,80}"))) { "Invalid reminder identifier." }
        require(at > 0L) { "Invalid reminder time." }

        val normalized = JSONObject()
            .put("id", id)
            .put("at", at)
            .put("text", text)
            .put("kind", kind)
        val items = read(context)
        val updated = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            if (item.optString("id") != id) updated.put(item)
        }
        updated.put(normalized)
        write(context, updated)
        scheduleAlarm(context, normalized)
    }

    @Synchronized
    fun cancel(context: Context, id: String): Boolean {
        if (!id.matches(Regex("[A-Za-z0-9_-]{1,80}"))) return false
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.cancel(pendingIntent(context, id))
        val items = read(context)
        val updated = JSONArray()
        var removed = false
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            if (item.optString("id") == id) removed = true else updated.put(item)
        }
        write(context, updated)
        return removed
    }

    @Synchronized
    fun rescheduleAfterBoot(context: Context) {
        val items = read(context)
        val updated = JSONArray()
        val now = System.currentTimeMillis()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val at = item.optLong("at", 0L)
            if (at <= 0L || at < now - 24L * 60L * 60L * 1000L) continue
            updated.put(item)
            scheduleAlarm(context, item)
        }
        write(context, updated)
    }

    @Synchronized
    fun remove(context: Context, id: String) {
        val items = read(context)
        val updated = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            if (item.optString("id") != id) updated.put(item)
        }
        write(context, updated)
    }

    private fun scheduleAlarm(context: Context, reminder: JSONObject) {
        val at = reminder.optLong("at")
        val triggerAt = maxOf(at, System.currentTimeMillis() + 1000L)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent(context, reminder.optString("id")))
    }

    private fun pendingIntent(context: Context, id: String): PendingIntent {
        val intent = Intent(context, ReminderReceiver::class.java)
            .setAction("com.swapnild.jarvis.REMINDER")
            .putExtra("id", id)
        return PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun read(context: Context): JSONArray = try {
        JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(ITEMS, "[]"))
    } catch (_: Exception) {
        JSONArray()
    }

    private fun write(context: Context, items: JSONArray) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(ITEMS, items.toString())
            .apply()
    }

    fun showNotification(context: Context, reminder: JSONObject) {
        if (Build.VERSION.SDK_INT >= 33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "JARVIS reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Scheduled reminders and timers from JARVIS"
                    lockscreenVisibility = Notification.VISIBILITY_PRIVATE
                }
            )
        }
        val id = reminder.optString("id")
        val openApp = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val contentIntent = PendingIntent.getActivity(
            context,
            id.hashCode(),
            openApp,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val title = reminder.optString("kind", "Reminder").take(40).ifBlank { "Reminder" }
        val body = reminder.optString("text", "You have a reminder.").take(MAX_TEXT)
        val notification = if (Build.VERSION.SDK_INT >= 26) {
            Notification.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("JARVIS · $title")
                .setContentText(body)
                .setStyle(Notification.BigTextStyle().bigText(body))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("JARVIS · $title")
                .setContentText(body)
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .build()
        }
        manager.notify(id.hashCode(), notification)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getStringExtra("id").orEmpty()
        if (id.isBlank()) return
        val pending = goAsync()
        Thread {
            try {
                val prefs = context.getSharedPreferences("jarvis_reminders_v1", Context.MODE_PRIVATE)
                val items = try { JSONArray(prefs.getString("items", "[]")) } catch (_: Exception) { JSONArray() }
                var found: JSONObject? = null
                val remaining = JSONArray()
                for (i in 0 until items.length()) {
                    val item = items.optJSONObject(i) ?: continue
                    if (item.optString("id") == id) found = item else remaining.put(item)
                }
                prefs.edit().putString("items", remaining.toString()).apply()
                found?.let { ReminderScheduler.showNotification(context, it) }
            } finally {
                pending.finish()
            }
        }.start()
    }
}

class ReminderBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        ReminderScheduler.rescheduleAfterBoot(context)
    }
}
