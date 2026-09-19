package expo.modules.screenguard

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The screen that goes over a watched app once the limit is spent.
 *
 * Drawn as a system overlay rather than by launching an activity: since
 * Android 10 an app in the background cannot reliably start one, and the
 * window is what every screen-time tool on the store ends up using. It is not
 * a trick — the user granted "Display over other apps" in Settings for exactly
 * this, and the shield says plainly what it is and who set it.
 *
 * Two deliberate restraints:
 * - It never covers the status bar, so the clock and the battery stay visible
 *   and the phone still feels like the child's phone.
 * - It does not block the back or home buttons. A child can always leave. The
 *   point is that the watched app is not usable, not that the device is
 *   hostage — and a shield that traps someone is both a worse experience and a
 *   much harder review conversation.
 */
class ShieldView(private val context: Context) {

  private var windowManager: WindowManager? = null
  private var root: View? = null

  val isShowing: Boolean get() = root != null

  @SuppressLint("SetTextI18n")
  fun show(title: String, body: String, graceLabel: String?, onGrace: (() -> Unit)?) {
    if (isShowing) return

    val manager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return

    val layout = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#F20B0F14"))
      setPadding(72, 72, 72, 72)
    }

    layout.addView(TextView(context).apply {
      text = title
      setTextColor(Color.parseColor("#F2F6F8"))
      textSize = 26f
      gravity = Gravity.CENTER
    })

    layout.addView(TextView(context).apply {
      text = body
      setTextColor(Color.parseColor("#B7C2CC"))
      textSize = 16f
      gravity = Gravity.CENTER
      setPadding(0, 28, 0, 0)
    })

    if (graceLabel != null && onGrace != null) {
      layout.addView(Button(context).apply {
        text = graceLabel
        setTextColor(Color.parseColor("#0B0F14"))
        background = GradientDrawable().apply {
          cornerRadius = 24f
          setColor(Color.parseColor("#CDFF47"))
        }
        setPadding(48, 24, 48, 24)
        setOnClickListener {
          onGrace()
          hide()
        }
      }, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply { topMargin = 48 })
    }

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      // Focusable, so the button is tappable, but explicitly NOT
      // FLAG_NOT_TOUCH_MODAL: taps outside the shield must not fall through to
      // the app underneath, or the block is decorative.
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )

    try {
      manager.addView(layout, params)
      windowManager = manager
      root = layout
    } catch (error: Throwable) {
      // The permission can be revoked while the service is running. Failing
      // quietly is right: the watcher will notice on its next tick and tell
      // the JS side that enforcement is no longer possible.
      windowManager = null
      root = null
    }
  }

  fun hide() {
    val manager = windowManager
    val view = root
    if (manager != null && view != null) {
      try {
        manager.removeView(view)
      } catch (error: Throwable) {
        // Already gone.
      }
    }
    windowManager = null
    root = null
  }
}
