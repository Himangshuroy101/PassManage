package com.passmanage.app

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.net.URI
import java.util.Locale

data class AutofillVaultItem(
    val id: String,
    val appName: String,
    val username: String,
    val password: String,
    val siteUrl: String,
    val category: String = "login",
    val tags: List<String> = emptyList(),
    val isFavorite: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toJsonObject(): JSONObject {
        val json = JSONObject()
        json.put("id", id)
        json.put("appName", appName)
        json.put("username", username)
        json.put("password", password)
        json.put("siteUrl", siteUrl)
        json.put("category", category)
        val tagsArray = JSONArray()
        tags.forEach { tagsArray.put(it) }
        json.put("tags", tagsArray)
        json.put("isFavorite", isFavorite)
        json.put("createdAt", createdAt)
        json.put("updatedAt", updatedAt)
        return json
    }

    companion object {
        fun fromJsonObject(json: JSONObject): AutofillVaultItem {
            val tagsList = mutableListOf<String>()
            val tagsArray = json.optJSONArray("tags")
            if (tagsArray != null) {
                for (i in 0 until tagsArray.length()) {
                    tagsList.add(tagsArray.optString(i))
                }
            }
            return AutofillVaultItem(
                id = json.optString("id", System.currentTimeMillis().toString()),
                appName = json.optString("appName", "Unknown Account"),
                username = json.optString("username", ""),
                password = json.optString("password", ""),
                siteUrl = json.optString("siteUrl", ""),
                category = json.optString("category", "login"),
                tags = tagsList,
                isFavorite = json.optBoolean("isFavorite", false),
                createdAt = json.optLong("createdAt", System.currentTimeMillis()),
                updatedAt = json.optLong("updatedAt", System.currentTimeMillis())
            )
        }
    }
}

object AutofillStorage {
    private const val TAG = "PassManageAutofill"
    private const val PREFS_NAME = "passmanage_autofill_store"
    private const val KEY_VAULT_ITEMS = "vault_items_json"
    private const val KEY_PENDING_ITEMS = "pending_saved_items_json"

    fun saveVaultData(context: Context, json: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_VAULT_ITEMS, json).apply()
        Log.d(TAG, "Vault data synced to Autofill storage (${json.length} bytes)")
    }

    fun getVaultItems(context: Context): List<AutofillVaultItem> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val jsonStr = prefs.getString(KEY_VAULT_ITEMS, null) ?: return emptyList()
        val list = mutableListOf<AutofillVaultItem>()
        try {
            val array = JSONArray(jsonStr)
            for (i in 0 until array.length()) {
                val obj = array.optJSONObject(i) ?: continue
                list.add(AutofillVaultItem.fromJsonObject(obj))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse vault items in AutofillStorage", e)
        }
        return list
    }

    fun addPendingSavedItem(context: Context, newItem: AutofillVaultItem) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existingJson = prefs.getString(KEY_PENDING_ITEMS, "[]")
        try {
            val array = JSONArray(existingJson)
            val updatedArray = JSONArray()
            var replaced = false

            for (i in 0 until array.length()) {
                val obj = array.optJSONObject(i) ?: continue
                val existing = AutofillVaultItem.fromJsonObject(obj)
                // If same username and target app, update password
                if (existing.username.equals(newItem.username, ignoreCase = true) &&
                    (existing.appName.equals(newItem.appName, ignoreCase = true) ||
                     existing.siteUrl.equals(newItem.siteUrl, ignoreCase = true))
                ) {
                    updatedArray.put(newItem.toJsonObject())
                    replaced = true
                } else {
                    updatedArray.put(obj)
                }
            }

            if (!replaced) {
                updatedArray.put(newItem.toJsonObject())
            }

            prefs.edit().putString(KEY_PENDING_ITEMS, updatedArray.toString()).apply()
            Log.d(TAG, "Pending auto-saved item stored: ${newItem.appName} (${newItem.username})")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to store pending auto-saved item", e)
        }
    }

    fun getPendingSavedItems(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_PENDING_ITEMS, "[]") ?: "[]"
    }

    fun clearPendingSavedItems(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_PENDING_ITEMS, "[]").apply()
        Log.d(TAG, "Pending auto-saved items cleared")
    }

    /**
     * Matches vault items against web domain or package name.
     * Returns matching items first; falls back to all login items so the user is never stuck.
     */
    fun findMatches(context: Context, packageName: String?, webDomain: String?): List<AutofillVaultItem> {
        val allItems = getVaultItems(context)
        if (allItems.isEmpty()) return emptyList()

        val directMatches = mutableListOf<AutofillVaultItem>()
        val cleanDomain = webDomain?.lowercase(Locale.ROOT)?.removePrefix("www.")?.removePrefix("m.") ?: ""
        val cleanPkg = packageName?.lowercase(Locale.ROOT) ?: ""

        for (item in allItems) {
            val appLower = item.appName.lowercase(Locale.ROOT)
            val urlLower = item.siteUrl.lowercase(Locale.ROOT)

            var isMatch = false

            if (cleanDomain.isNotEmpty()) {
                if (urlLower.contains(cleanDomain) || cleanDomain.contains(appLower) || appLower.contains(cleanDomain)) {
                    isMatch = true
                }
            }

            val isBrowserApp = cleanPkg.contains("chrome") || cleanPkg.contains("browser") || cleanPkg.contains("sbrowser")
            if (!isMatch && cleanPkg.isNotEmpty() && !isBrowserApp) {
                // e.g. com.netflix.mediaclient vs "Netflix"
                val appKeywords = appLower.split(" ", "-", "_").filter { it.length > 2 }
                for (kw in appKeywords) {
                    if (cleanPkg.contains(kw)) {
                        isMatch = true
                        break
                    }
                }
            }

            if (isMatch) {
                directMatches.add(item)
            }
        }

        if (directMatches.isNotEmpty()) {
            return directMatches
        }

        // Fallback: return login items (favorited first, then recent)
        return allItems
            .filter { it.password.isNotEmpty() }
            .sortedWith(compareByDescending<AutofillVaultItem> { it.isFavorite }.thenByDescending { it.updatedAt })
            .take(6)
    }

    /**
     * Derives a clean user-facing title from package name or web domain.
     */
    fun deriveAppName(packageName: String, webDomain: String?): String {
        if (!webDomain.isNullOrBlank()) {
            val host = webDomain.removePrefix("www.").removePrefix("m.")
            val mainPart = host.split(".").firstOrNull() ?: host
            if (mainPart.isNotBlank()) {
                return mainPart.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() }
            }
        }

        if (packageName.isNotBlank()) {
            val segments = packageName.split(".")
            val candidate = if (segments.size >= 2) {
                val candidatePart = segments[1]
                if (candidatePart != "android" && candidatePart != "app" && candidatePart != "google") {
                    candidatePart
                } else {
                    segments.last()
                }
            } else {
                segments.last()
            }
            return candidate.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() }
        }

        return "New Account"
    }
}
