package com.passmanage.app

import android.annotation.TargetApi
import android.app.assist.AssistStructure
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.Dataset
import android.service.autofill.Field
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.Presentations
import android.service.autofill.SaveCallback
import android.service.autofill.SaveInfo
import android.service.autofill.SaveRequest
import android.text.InputType
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import java.util.Locale

@TargetApi(Build.VERSION_CODES.O)
@Suppress("DEPRECATION")
class PassManageAutofillService : AutofillService() {

    companion object {
        private const val TAG = "PassManageAutofill"
    }

    data class ParsedForm(
        var usernameId: AutofillId? = null,
        var passwordId: AutofillId? = null,
        var focusedId: AutofillId? = null,
        var usernameValue: String? = null,
        var passwordValue: String? = null,
        var webDomain: String? = null
    )

    override fun onFillRequest(
        request: FillRequest,
        cancellationSignal: CancellationSignal,
        callback: FillCallback
    ) {
        try {
            val fillContexts = request.fillContexts
            val latestContext = fillContexts.lastOrNull()
            if (latestContext == null) {
                callback.onSuccess(null)
                return
            }

            val structure = latestContext.structure
            val form = parseAssistStructure(structure)
            val clientPackageName = structure.activityComponent?.packageName ?: ""

            Log.d(TAG, "onFillRequest: package=$clientPackageName domain=${form.webDomain} userNode=${form.usernameId != null} passNode=${form.passwordId != null} focusedNode=${form.focusedId != null}")

            if (form.usernameId == null && form.passwordId == null) {
                if (form.focusedId != null) {
                    form.usernameId = form.focusedId
                } else {
                    Log.d(TAG, "No username, password or focused inputs detected in form")
                    callback.onSuccess(null)
                    return
                }
            }

            val matchingItems = AutofillStorage.findMatches(applicationContext, clientPackageName, form.webDomain)
            val responseBuilder = FillResponse.Builder()
            val myAppPackageName = applicationContext.packageName

            // Setup Full-Width Fill Dialog (Native Bottom Sheet UI like Google Password Manager) on Android 13+ (API 33+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && matchingItems.isNotEmpty()) {
                val headerView = RemoteViews(myAppPackageName, R.layout.autofill_dialog_header).apply {
                    val appTitle = matchingItems[0].appName
                    setTextViewText(R.id.dialog_header_title, "Sign in with PassManage")
                    setTextViewText(R.id.dialog_header_subtitle, "Select a saved account for $appTitle")
                }
                responseBuilder.setDialogHeader(headerView)

                val triggerList = mutableListOf<AutofillId>()
                form.usernameId?.let { triggerList.add(it) }
                form.passwordId?.let { triggerList.add(it) }
                form.focusedId?.let { if (!triggerList.contains(it)) triggerList.add(it) }

                if (triggerList.isNotEmpty()) {
                    responseBuilder.setFillDialogTriggerIds(*triggerList.toTypedArray())
                }
            }

            // 1. Populate Matching Credentials
            if (matchingItems.isNotEmpty()) {
                for (item in matchingItems.take(5)) {
                    val subtitleText = if (item.username.isNotBlank()) item.username else "Saved Account"

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        // Dialog presentation for the full-width Bottom Sheet
                        val dialogItem = RemoteViews(myAppPackageName, R.layout.autofill_dialog_item).apply {
                            setTextViewText(R.id.dialog_item_title, if (item.username.isNotBlank()) item.username else item.appName)
                            setTextViewText(R.id.dialog_item_subtitle, "${item.appName} • PassManage")
                            val initial = if (item.appName.isNotBlank()) item.appName.take(1).uppercase(Locale.ROOT) else "P"
                            setTextViewText(R.id.dialog_item_avatar_text, initial)
                        }

                        // Fallback presentation for dropdown menu
                        val dropdownItem = RemoteViews(myAppPackageName, R.layout.autofill_dataset_item).apply {
                            setTextViewText(R.id.autofill_title, item.appName)
                            setTextViewText(R.id.autofill_tag, "• PassManage")
                            setTextViewText(R.id.autofill_subtitle, subtitleText)
                        }

                        val presentations = Presentations.Builder()
                            .setMenuPresentation(dropdownItem)
                            .setDialogPresentation(dialogItem)
                            .build()

                        val datasetBuilder = Dataset.Builder()

                        form.usernameId?.let { uId ->
                            if (item.username.isNotBlank()) {
                                val field = Field.Builder()
                                    .setValue(AutofillValue.forText(item.username))
                                    .setPresentations(presentations)
                                    .build()
                                datasetBuilder.setField(uId, field)
                            }
                        }

                        form.passwordId?.let { pId ->
                            if (item.password.isNotBlank()) {
                                val field = Field.Builder()
                                    .setValue(AutofillValue.forText(item.password))
                                    .setPresentations(presentations)
                                    .build()
                                datasetBuilder.setField(pId, field)
                            }
                        }

                        form.focusedId?.let { fId ->
                            if (fId != form.usernameId && fId != form.passwordId) {
                                val field = Field.Builder()
                                    .setValue(AutofillValue.forText(item.username))
                                    .setPresentations(presentations)
                                    .build()
                                datasetBuilder.setField(fId, field)
                            }
                        }

                        responseBuilder.addDataset(datasetBuilder.build())
                    } else {
                        // Legacy Dropdown UI (API < 33)
                        val presentation = RemoteViews(myAppPackageName, R.layout.autofill_dataset_item).apply {
                            setTextViewText(R.id.autofill_title, item.appName)
                            setTextViewText(R.id.autofill_tag, "• PassManage")
                            setTextViewText(R.id.autofill_subtitle, subtitleText)
                        }

                        val datasetBuilder = Dataset.Builder(presentation)
                        var hasValue = false

                        form.usernameId?.let { uId ->
                            if (item.username.isNotBlank()) {
                                datasetBuilder.setValue(uId, AutofillValue.forText(item.username), presentation)
                                hasValue = true
                            }
                        }

                        form.passwordId?.let { pId ->
                            if (item.password.isNotBlank()) {
                                datasetBuilder.setValue(pId, AutofillValue.forText(item.password), presentation)
                                hasValue = true
                            }
                        }

                        form.focusedId?.let { fId ->
                            if (fId != form.usernameId && fId != form.passwordId) {
                                datasetBuilder.setValue(fId, AutofillValue.forText(item.username), presentation)
                                hasValue = true
                            }
                        }

                        if (hasValue) {
                            responseBuilder.addDataset(datasetBuilder.build())
                        }
                    }
                }
            }

            // 2. Setup SaveInfo so Android prompts to save passwords on login / signup
            val requiredIds = mutableListOf<AutofillId>()
            val optionalIds = mutableListOf<AutofillId>()

            if (form.passwordId != null) {
                requiredIds.add(form.passwordId!!)
                if (form.usernameId != null) {
                    optionalIds.add(form.usernameId!!)
                }
            } else if (form.usernameId != null) {
                requiredIds.add(form.usernameId!!)
            }

            if (requiredIds.isNotEmpty()) {
                val saveType = if (form.passwordId != null) {
                    SaveInfo.SAVE_DATA_TYPE_PASSWORD or SaveInfo.SAVE_DATA_TYPE_USERNAME
                } else {
                    SaveInfo.SAVE_DATA_TYPE_USERNAME
                }

                val saveInfoBuilder = SaveInfo.Builder(saveType, requiredIds.toTypedArray())
                if (optionalIds.isNotEmpty()) {
                    saveInfoBuilder.setOptionalIds(optionalIds.toTypedArray())
                }
                responseBuilder.setSaveInfo(saveInfoBuilder.build())
            }

            callback.onSuccess(responseBuilder.build())
        } catch (e: Exception) {
            Log.e(TAG, "Error processing onFillRequest", e)
            callback.onSuccess(null)
        }
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        try {
            val fillContexts = request.fillContexts
            val latestContext = fillContexts.lastOrNull()
            if (latestContext == null) {
                callback.onSuccess()
                return
            }

            val structure = latestContext.structure
            val form = parseAssistStructure(structure)
            val clientPackageName = structure.activityComponent?.packageName ?: ""
            val webDomain = form.webDomain

            val username = form.usernameValue?.trim() ?: ""
            val password = form.passwordValue?.trim() ?: ""

            Log.d(TAG, "onSaveRequest: package=$clientPackageName domain=$webDomain user=$username hasPassword=${password.isNotEmpty()}")

            if (password.isNotEmpty()) {
                val appName = AutofillStorage.deriveAppName(clientPackageName, webDomain)
                val siteUrl = if (!webDomain.isNullOrBlank()) "https://$webDomain" else "app://$clientPackageName"

                val autoSavedItem = AutofillVaultItem(
                    id = System.currentTimeMillis().toString(),
                    appName = appName,
                    username = username,
                    password = password,
                    siteUrl = siteUrl,
                    category = "login",
                    tags = listOf("Autofill", "Auto-Saved"),
                    isFavorite = false,
                    createdAt = System.currentTimeMillis(),
                    updatedAt = System.currentTimeMillis()
                )

                AutofillStorage.addPendingSavedItem(applicationContext, autoSavedItem)
                Log.d(TAG, "Successfully captured and auto-saved credential for $appName ($username)")
            }

            callback.onSuccess()
        } catch (e: Exception) {
            Log.e(TAG, "Error processing onSaveRequest", e)
            callback.onFailure(e.localizedMessage)
        }
    }

    private fun parseAssistStructure(structure: AssistStructure): ParsedForm {
        val form = ParsedForm()
        val nodeCount = structure.windowNodeCount
        for (i in 0 until nodeCount) {
            val windowNode = structure.getWindowNodeAt(i)
            traverseNode(windowNode.rootViewNode, form)
        }
        return form
    }

    private fun traverseNode(node: AssistStructure.ViewNode?, form: ParsedForm) {
        if (node == null) return

        // Extract web domain from Chrome or WebView
        if (!node.webDomain.isNullOrBlank() && form.webDomain == null) {
            form.webDomain = node.webDomain
        }

        if (node.isFocused && form.focusedId == null && node.autofillId != null) {
            form.focusedId = node.autofillId
        }

        val hints = node.autofillHints
        val hintText = (node.hint ?: "").toString().lowercase(Locale.ROOT)
        val className = (node.className ?: "").toString()
        val inputType = node.inputType
        val idEntry = (node.idEntry ?: "").lowercase(Locale.ROOT)

        var isPasswordHint = false
        var isUsernameHint = false

        // 1. Inspect HTML attributes (critical for Chrome and WebViews)
        val htmlInfo = node.htmlInfo
        if (htmlInfo != null) {
            val tag = (htmlInfo.tag ?: "").lowercase(Locale.ROOT)
            val attributes = htmlInfo.attributes
            if (attributes != null) {
                for (pair in attributes) {
                    val attrKey = (pair.first ?: "").lowercase(Locale.ROOT)
                    val attrVal = (pair.second ?: "").lowercase(Locale.ROOT)

                    if (attrKey == "type" && attrVal == "password") {
                        isPasswordHint = true
                    }
                    if (attrKey == "name" || attrKey == "id" || attrKey == "autocomplete" || attrKey == "placeholder") {
                        if (attrVal.contains("password") || attrVal.contains("pass") || attrVal == "pwd") {
                            isPasswordHint = true
                        }
                        if (attrVal.contains("username") || attrVal.contains("user") ||
                            attrVal.contains("email") || attrVal.contains("login") ||
                            attrVal.contains("phone") || attrVal.contains("account")) {
                            isUsernameHint = true
                        }
                    }
                }
            }
            if (tag == "input" && !isPasswordHint && !isUsernameHint) {
                // If it is a web input and not password, consider it a potential username field
                if (form.usernameId == null) {
                    isUsernameHint = true
                }
            }
        }

        // 2. Check idEntry (e.g. "username", "password", "email_input")
        if (idEntry.contains("password") || idEntry.contains("pass") || idEntry == "pwd") {
            isPasswordHint = true
        }
        if (idEntry.contains("username") || idEntry.contains("user") || idEntry.contains("email") || idEntry.contains("login")) {
            isUsernameHint = true
        }

        // 3. Check autofillHints
        if (hints != null) {
            for (h in hints) {
                val lower = h.lowercase(Locale.ROOT)
                if (lower.contains("password")) isPasswordHint = true
                if (lower.contains("username") || lower.contains("email") || lower.contains("phone")) isUsernameHint = true
            }
        }

        // 4. Check hint / placeholder text
        if (hintText.contains("password") || hintText.contains("passcode") || hintText.contains("pin")) {
            isPasswordHint = true
        }
        if (hintText.contains("username") || hintText.contains("user name") || hintText.contains("email") || hintText.contains("login") || hintText.contains("phone")) {
            isUsernameHint = true
        }

        // 5. Check inputType variations
        val isPasswordType = (inputType and InputType.TYPE_MASK_VARIATION) == InputType.TYPE_TEXT_VARIATION_PASSWORD ||
                             (inputType and InputType.TYPE_MASK_VARIATION) == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
                             (inputType and InputType.TYPE_NUMBER_VARIATION_PASSWORD) == InputType.TYPE_NUMBER_VARIATION_PASSWORD

        val isEmailOrUsernameType = (inputType and InputType.TYPE_MASK_VARIATION) == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS ||
                                    (inputType and InputType.TYPE_MASK_VARIATION) == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS

        val autofillType = node.autofillType
        val isTextAutofill = autofillType == View.AUTOFILL_TYPE_TEXT || autofillType == 0

        if (node.autofillId != null) {
            // Assign password node
            if (isPasswordHint || isPasswordType) {
                if (form.passwordId == null) {
                    form.passwordId = node.autofillId
                    val textVal = node.text?.toString() ?: node.autofillValue?.textValue?.toString()
                    if (!textVal.isNullOrBlank()) {
                        form.passwordValue = textVal
                    }
                }
            }
            // Assign username node
            else if (isUsernameHint || isEmailOrUsernameType || (form.usernameId == null && isTextAutofill && !isPasswordType)) {
                if (form.usernameId == null && (isUsernameHint || isEmailOrUsernameType || className.contains("EditText", ignoreCase = true) || htmlInfo != null)) {
                    form.usernameId = node.autofillId
                    val textVal = node.text?.toString() ?: node.autofillValue?.textValue?.toString()
                    if (!textVal.isNullOrBlank()) {
                        form.usernameValue = textVal
                    }
                }
            }
        }

        // Traverse children recursively
        for (i in 0 until node.childCount) {
            traverseNode(node.getChildAt(i), form)
        }
    }
}
