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
            shareImageWithPhone(base64Data, fileName, shareText, "");
        }

        @JavascriptInterface
        public void shareImageWithPhone(String base64Data, String fileName, String shareText, String phone) {
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
                    shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    shareIntent.putExtra(Intent.EXTRA_TEXT, shareText);
                    shareIntent.setType("image/png");
                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    // Add JID if phone number is provided
                    if (phone != null && !phone.trim().isEmpty()) {
                        String cleanPhone = phone.replaceAll("\\D", "");
                        if (!cleanPhone.isEmpty()) {
                            shareIntent.putExtra("jid", cleanPhone + "@s.whatsapp.net");
                        }
                    }

                    // Try to direct-share to WhatsApp or WhatsApp Business
                    String targetPackage = null;
                    if (isPackageInstalled("com.whatsapp", mContext)) {
                        targetPackage = "com.whatsapp";
                    } else if (isPackageInstalled("com.whatsapp.w4b", mContext)) {
                        targetPackage = "com.whatsapp.w4b";
                    }

                    if (targetPackage != null) {
                        shareIntent.setPackage(targetPackage);
                        // Explicitly grant read permissions for the URI to WhatsApp
                        mContext.grantUriPermission(targetPackage, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        
                        Intent whatsappIntent = new Intent(shareIntent);
                        whatsappIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        try {
                            mContext.startActivity(whatsappIntent);
                            return; // Success, shared directly to WhatsApp
                        } catch (Exception e) {
                            e.printStackTrace();
                            // Fallback if launch fails
                        }
                    }

                    // Fallback to standard sharing chooser
                    Intent chooserIntent = Intent.createChooser(shareIntent, "Share Receipt");
                    chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(chooserIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        private boolean isPackageInstalled(String packageName, Context context) {
            try {
                context.getPackageManager().getPackageInfo(packageName, 0);
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }
}
