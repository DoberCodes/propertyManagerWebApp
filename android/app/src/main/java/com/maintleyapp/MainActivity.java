package com.maintleyapp;

import android.os.Bundle;

import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		registerPlugin(NativeScannerPlugin.class);
		super.onCreate(savedInstanceState);
		hideSystemNavigation();
	}

	@Override
	public void onResume() {
		super.onResume();
		hideSystemNavigation();
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) {
			hideSystemNavigation();
		}
	}

	private void hideSystemNavigation() {
		WindowInsetsControllerCompat controller =
				new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
		controller.setSystemBarsBehavior(
				WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
		);
		controller.hide(WindowInsetsCompat.Type.navigationBars());
	}
}
