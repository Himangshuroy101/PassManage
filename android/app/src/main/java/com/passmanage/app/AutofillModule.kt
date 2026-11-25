package com.passmanage.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.autofill.AutofillManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AutofillModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PassManageAutofill"

    @ReactMethod
    fun isAutofillSupported(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
    }

    @ReactMethod
    fun isAutofillServiceEnabled(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val autofillManager = reactApplicationContext.getSystemService(AutofillManager::class.java)
                val isEnabled = autofillManager?.hasEnabledAutofillServices() == true
                promise.resolve(isEnabled)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestSetAutofillService(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val currentPkg = reactApplicationContext.packageName
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE).apply {
                        data = Uri.parse("package:$currentPkg")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    reactApplicationContext.startActivity(intent)
                    promise.resolve(true)
                } catch (e: Exception) {
                    // Fallback to opening system autofill picker screen
                    val fallbackIntent = Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    reactApplicationContext.startActivity(fallbackIntent)
                    promise.resolve(true)
                }
            } else {
                promise.reject("UNSUPPORTED", "Autofill requires Android 8.0 (API 26) or above")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun syncVaultData(vaultJson: String, promise: Promise) {
        try {
            AutofillStorage.saveVaultData(reactApplicationContext, vaultJson)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun getPendingSavedItems(promise: Promise) {
        try {
            val pendingJson = AutofillStorage.getPendingSavedItems(reactApplicationContext)
            promise.resolve(pendingJson)
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun clearPendingSavedItems(promise: Promise) {
        try {
            AutofillStorage.clearPendingSavedItems(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e.localizedMessage, e)
        }
    }
}
