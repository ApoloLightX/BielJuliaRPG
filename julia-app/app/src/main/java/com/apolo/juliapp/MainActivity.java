package com.apolo.juliapp;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.database.Cursor;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int PICK_PDF = 2048;
    private WebView webView;
    private String pendingSubjectId = "";
    private String pendingSubjectName = "";
    private String pendingDate = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void pickPdf(String subjectId, String subjectName, String date) {
            pendingSubjectId = subjectId == null ? "" : subjectId;
            pendingSubjectName = subjectName == null ? "" : subjectName;
            pendingDate = date == null ? "" : date;
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/pdf");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
            startActivityForResult(intent, PICK_PDF);
        }

        @JavascriptInterface
        public void openPdf(String uriString) {
            try {
                Uri uri = Uri.parse(uriString);
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/pdf");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(intent);
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Não encontrei um leitor de PDF no aparelho.", Toast.LENGTH_LONG).show());
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_PDF && resultCode == RESULT_OK && data != null && data.getData() != null) {
            Uri uri = data.getData();
            try {
                final int flags = data.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION;
                getContentResolver().takePersistableUriPermission(uri, flags);
            } catch (Exception ignored) {}

            String name = getDisplayName(uri);
            long size = getSize(uri);
            try {
                JSONObject obj = new JSONObject();
                obj.put("uri", uri.toString());
                obj.put("name", name);
                obj.put("size", size);
                obj.put("subjectId", pendingSubjectId);
                obj.put("subjectName", pendingSubjectName);
                obj.put("date", pendingDate);
                webView.evaluateJavascript("window.onNativePdfImported(" + JSONObject.quote(obj.toString()) + ")", null);
            } catch (Exception e) {
                Toast.makeText(this, "Não foi possível registrar o PDF.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private String getDisplayName(Uri uri) {
        String result = "Anotação.pdf";
        Cursor c = getContentResolver().query(uri, null, null, null, null);
        if (c != null) {
            try {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (c.moveToFirst() && idx >= 0) result = c.getString(idx);
            } finally { c.close(); }
        }
        return result;
    }

    private long getSize(Uri uri) {
        long result = 0;
        Cursor c = getContentResolver().query(uri, null, null, null, null);
        if (c != null) {
            try {
                int idx = c.getColumnIndex(OpenableColumns.SIZE);
                if (c.moveToFirst() && idx >= 0 && !c.isNull(idx)) result = c.getLong(idx);
            } finally { c.close(); }
        }
        return result;
    }
}
