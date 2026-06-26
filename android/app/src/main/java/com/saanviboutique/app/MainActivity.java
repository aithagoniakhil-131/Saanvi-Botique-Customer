package com.saanviboutique.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Expose native sharing functionality directly to the WebView
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new WebAppInterface(this), "AndroidShare");
        }
    }

    public static class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void shareImage(String base64Data, String fileName, String shareText) {
            try {
                // Decode base64 image data
                byte[] decodedString = Base64.decode(base64Data, Base64.DEFAULT);
                
                // Write to cache directory (visible to FileProvider)
                File cachePath = new File(mContext.getCacheDir(), "receipts");
                cachePath.mkdirs();
                
                File file = new File(cachePath, fileName);
                FileOutputStream stream = new FileOutputStream(file);
                stream.write(decodedString);
                stream.close();

                // Generate secure content:// URI
                Uri contentUri = FileProvider.getUriForFile(mContext, mContext.getPackageName() + ".fileprovider", file);

                if (contentUri != null) {
                    Intent shareIntent = new Intent();
                    shareIntent.setAction(Intent.ACTION_SEND);
                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    shareIntent.setDataAndType(contentUri, mContext.getContentResolver().getType(contentUri));
                    shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    shareIntent.putExtra(Intent.EXTRA_TEXT, shareText);
                    shareIntent.setType("image/png");

                    // Start sharing intent chooser
                    Intent chooserIntent = Intent.createChooser(shareIntent, "Share Receipt");
                    chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(chooserIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
