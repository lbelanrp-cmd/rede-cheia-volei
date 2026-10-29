"""Troca a MainActivity gerada pelo Capacitor por uma que se recupera quando o
Android derruba o processo de desenho do WebView (tela cinza ao voltar do segundo plano)."""
import glob, re
path = glob.glob("android/app/src/main/java/**/MainActivity.java", recursive=True)[0]
pkg = re.search(r"package\s+([\w.]+);", open(path).read()).group(1)
open(path, "w").write(f"""package {pkg};

import android.os.Build;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onStart() {{
        super.onStart();
        if (bridge != null && bridge.getWebView() != null) {{
            bridge.getWebView().setWebViewClient(new BridgeWebViewClient(bridge) {{
                @Override
                public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {{
                    // o Android matou o desenho da página: recria a tela em vez de ficar cinza
                    runOnUiThread(() -> recreate());
                    return true;
                }}
            }});
        }}
    }}

    @Override
    public void onResume() {{
        super.onResume();
        if (bridge != null && bridge.getWebView() != null) {{
            WebView w = bridge.getWebView();
            w.onResume();
            w.resumeTimers();
            w.invalidate();
        }}
    }}
}}
""")
print("MainActivity atualizada:", path)
