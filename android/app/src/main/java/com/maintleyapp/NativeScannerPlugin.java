package com.maintleyapp;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(
    name = "NativeScanner",
    permissions = {
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA })
    }
)
public class NativeScannerPlugin extends Plugin {
    private static final String MODE_BARCODE = "barcode";
    private static final String MODE_PHOTO = "photo";

    @PluginMethod
    public void scan(PluginCall call) {
        String mode = call.getString("mode", MODE_BARCODE);
        if (!MODE_BARCODE.equals(mode) && !MODE_PHOTO.equals(mode)) {
            call.reject("Unsupported scanner mode.");
            return;
        }

        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermissionCallback");
            return;
        }

        launchScanner(call, mode);
    }

    @PermissionCallback
    private void cameraPermissionCallback(PluginCall call) {
        if (call == null) return;
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            launchScanner(call, call.getString("mode", MODE_BARCODE));
        } else {
            call.reject("Camera permission is required to scan.");
        }
    }

    private void launchScanner(PluginCall call, String mode) {
        Intent intent = new Intent(getActivity(), NativeScannerActivity.class);
        intent.putExtra(NativeScannerActivity.EXTRA_MODE, mode);
        startActivityForResult(call, intent, "scannerResultCallback");
    }

    @ActivityCallback
    private void scannerResultCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Scanner was closed.");
            return;
        }

        Intent data = result.getData();
        JSObject response = new JSObject();
        String mode = data.getStringExtra(NativeScannerActivity.RESULT_MODE);
        response.put("mode", mode);

        String value = data.getStringExtra(NativeScannerActivity.RESULT_VALUE);
        if (value != null) {
            response.put("value", value);
        }

        String uri = data.getStringExtra(NativeScannerActivity.RESULT_URI);
        if (uri != null) {
            response.put("uri", uri);
        }

        call.resolve(response);
    }
}