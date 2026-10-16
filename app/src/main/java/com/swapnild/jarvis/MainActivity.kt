package com.swapnild.jarvis

import android.annotation.SuppressLint
import android.provider.AlarmClock
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.provider.MediaStore
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.widget.Toast
import android.app.Activity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(2, 8, 19)
        window.navigationBarColor = android.graphics.Color.rgb(2, 8, 19)
        window.decorView.systemUiVisibility = 0
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            setBackgroundColor(android.graphics.Color.rgb(2, 8, 19))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            webChromeClient = WebChromeClient()
            webViewClient = LocalOnlyWebViewClient()
            addJavascriptInterface(JarvisBridge(), "JarvisNative")
        }
        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    private inner class LocalOnlyWebViewClient : WebViewClientCompat() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest) =
            assetLoader.shouldInterceptRequest(request.url)

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val uri = request.url
            if (uri.host == "appassets.androidplatform.net" && uri.scheme == "https") return false
            if (uri.scheme == "https" || uri.scheme == "http" || uri.scheme == "mailto" ||
                uri.scheme == "tel" || uri.scheme == "sms") {
                return openExternal(uri)
            }
            return true
        }
    }

    private fun openExternal(uri: Uri): Boolean {
        return try {
            val intent = when (uri.scheme) {
                "tel" -> Intent(Intent.ACTION_DIAL, uri)
                "sms" -> Intent(Intent.ACTION_SENDTO, uri)
                else -> Intent(Intent.ACTION_VIEW, uri)
            }
            startActivity(intent)
            true
        } catch (_: ActivityNotFoundException) {
            toast("No app is available for this action.")
            true
        } catch (_: Exception) {
            toast("Could not open that link.")
            true
        }
    }

    private fun toast(message: String) = runOnUiThread {
        Toast.makeText(this, message.take(180), Toast.LENGTH_SHORT).show()
    }

    private inner class JarvisBridge {
        private val appPackages = setOf(
            "com.whatsapp", "com.google.android.youtube", "com.google.android.apps.youtube.music",
            "com.openai.chatgpt", "com.google.android.apps.bard", "com.netflix.mediaclient",
            "in.startv.hotstar", "com.amazon.avod.thirdpartyclient", "com.google.android.apps.maps",
            "com.google.android.gm", "com.android.chrome", "com.instagram.android"
        )

        @JavascriptInterface
        fun openApp(packageName: String): String {
            // The web UI passes Android intent action strings for these system shortcuts,
            // not package names. Handle them explicitly before the installed-app allowlist.
            val systemIntent = when (packageName) {
                "android.media.action.IMAGE_CAPTURE" ->
                    Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                "android.intent.action.SHOW_ALARMS" ->
                    Intent(AlarmClock.ACTION_SHOW_ALARMS)
                "android.settings.SETTINGS" ->
                    Intent(Settings.ACTION_SETTINGS)
                else -> null
            }
            if (systemIntent != null) {
                if (packageName == "android.intent.action.SHOW_ALARMS") {
                    // Some OEM clock apps do not implement ACTION_SHOW_ALARMS.
                    // Try it first, then fall back to the standard set-alarm screen.
                    try {
                        startActivity(systemIntent)
                        return result(true, "Clock opened.")
                    } catch (_: Exception) {
                        val now = java.util.Calendar.getInstance()
                        val fallback = Intent(AlarmClock.ACTION_SET_ALARM)
                            .putExtra(AlarmClock.EXTRA_HOUR, now.get(java.util.Calendar.HOUR_OF_DAY))
                            .putExtra(AlarmClock.EXTRA_MINUTES, now.get(java.util.Calendar.MINUTE))
                            .putExtra(AlarmClock.EXTRA_SKIP_UI, false)
                        return launchIntent(fallback, "No compatible clock app was found.")
                    }
                }
                return launchIntent(systemIntent, when (packageName) {
                    "android.media.action.IMAGE_CAPTURE" -> "No camera app can handle the camera action."
                    else -> "Could not open Android settings."
                })
            }
            if (packageName !in appPackages) return result(false, "App shortcut is not allowlisted.")
            return try {
                val launch = packageManager.getLaunchIntentForPackage(packageName)
                if (launch == null) {
                    toast("That app is not installed or cannot be opened.")
                    result(false, "App not installed or no launch activity.")
                } else {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(launch)
                    result(true, "App launch requested.")
                }
            } catch (_: Exception) {
                toast("Could not open that app.")
                result(false, "App launch failed.")
            }
        }

        @JavascriptInterface
        fun openSettings(section: String): String {
            val intent = when (section.lowercase()) {
                "dialer", "phone" -> Intent(Intent.ACTION_DIAL)
                "wifi" -> Intent(Settings.ACTION_WIFI_SETTINGS)
                "bluetooth" -> Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                "location" -> Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                "app" -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
                else -> Intent(Settings.ACTION_SETTINGS)
            }
            return launchIntent(intent, "Could not open Android settings.")
        }

        @JavascriptInterface
        fun call(number: String): String {
            val clean = number.filter { it.isDigit() || it == '+' }
            if (clean.length !in 3..20) return result(false, "Enter a valid phone number.")
            return launchIntent(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$clean")), "Could not open the dialer.")
        }

        @JavascriptInterface
        fun sms(number: String, message: String): String {
            val clean = number.filter { it.isDigit() || it == '+' }
            if (clean.length !in 3..20) return result(false, "Enter a valid phone number.")
            val uri = Uri.parse("smsto:$clean")
            val intent = Intent(Intent.ACTION_SENDTO, uri).putExtra("sms_body", message.take(2000))
            return launchIntent(intent, "Could not open the SMS app.")
        }

        @JavascriptInterface
        fun whatsapp(number: String, message: String, autoSend: Boolean): String {
            val digits = number.filter { it.isDigit() }
            if (digits.length !in 7..15) return result(false, "Enter a valid WhatsApp number.")
            val uri = Uri.parse("https://wa.me/$digits").buildUpon()
                .apply { if (message.isNotBlank()) appendQueryParameter("text", message.take(2000)) }
                .build()
            return try {
                startActivity(Intent(Intent.ACTION_VIEW, uri).setPackage("com.whatsapp"))
                result(true, "WhatsApp opened for review. Sending still requires the user's action.")
            } catch (_: Exception) {
                openExternal(uri)
                result(true, "Opened WhatsApp link in an available browser.")
            }
        }

        @JavascriptInterface
        fun setAlarm(epochMillis: String, label: String): String {
            val epoch = epochMillis.toLongOrNull() ?: return result(false, "Invalid alarm time.")
            val calendar = java.util.Calendar.getInstance().apply { timeInMillis = epoch }
            val intent = Intent(AlarmClock.ACTION_SET_ALARM)
                .putExtra(AlarmClock.EXTRA_HOUR, calendar.get(java.util.Calendar.HOUR_OF_DAY))
                .putExtra(AlarmClock.EXTRA_MINUTES, calendar.get(java.util.Calendar.MINUTE))
                .putExtra(AlarmClock.EXTRA_MESSAGE, label.take(100))
                .putExtra(AlarmClock.EXTRA_SKIP_UI, false)
            return launchIntent(intent, "No clock app can set an alarm.")
        }

        @JavascriptInterface fun speak(text: String): String {
            toast("Native speech output is not wired yet.")
            return result(false, "Native speech output is not implemented.")
        }
        @JavascriptInterface fun stopSpeaking(): String = result(true, "No native speech session is active.")
        @JavascriptInterface fun listen(): String {
            toast("Native voice input is not wired yet.")
            return result(false, "Native voice input is not implemented.")
        }
        @JavascriptInterface fun setWake(enabled: Boolean): String =
            result(false, "Always-on wake listening is not implemented.")
        @JavascriptInterface fun setVolume(percent: Int): String =
            result(false, "System volume control is not implemented.")
        @JavascriptInterface fun globalAction(action: String): String =
            result(false, "System-wide accessibility actions are not implemented.")
        @JavascriptInterface fun torch(enabled: Boolean): String =
            result(false, "Flashlight control is not implemented.")
        @JavascriptInterface fun requestPermissions(): String =
            result(false, "No runtime permissions are requested by this first APK foundation.")
        @JavascriptInterface fun hasNotificationAccess(): Boolean = false
        @JavascriptInterface fun openNotificationAccessSettings(): String {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            return result(true, "Opened notification access settings.")
        }
        @JavascriptInterface fun isAccessibilityOn(): Boolean = false
        @JavascriptInterface fun openAccessibilitySettings(): String {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            return result(true, "Opened accessibility settings.")
        }
        @JavascriptInterface fun getContacts(query: String): String = JSONArray().toString()
        @JavascriptInterface fun getSms(limit: Int): String = JSONArray().toString()
        @JavascriptInterface fun getNotifications(): String = JSONArray().toString()
        @JavascriptInterface fun replyNotification(key: String, text: String): String =
            result(false, "Notification replies are not implemented.")
        @JavascriptInterface fun callAction(action: String): String = result(false, "Unsupported action.")

        private fun launchIntent(intent: Intent, error: String): String = try {
            startActivity(intent)
            result(true, "Action handed to Android.")
        } catch (_: Exception) {
            toast(error)
            result(false, error)
        }

        private fun result(ok: Boolean, message: String) =
            JSONObject().put("ok", ok).put("message", message).toString()
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.removeJavascriptInterface("JarvisNative")
            webView.destroy()
        }
        super.onDestroy()
    }
}
