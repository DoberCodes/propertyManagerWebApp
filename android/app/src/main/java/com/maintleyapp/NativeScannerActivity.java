package com.maintleyapp;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.Preview;
import androidx.camera.core.ZoomState;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import java.io.File;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class NativeScannerActivity extends AppCompatActivity {
    public static final String EXTRA_MODE = "mode";
    public static final String RESULT_MODE = "mode";
    public static final String RESULT_VALUE = "value";
    public static final String RESULT_URI = "uri";

    private static final String MODE_BARCODE = "barcode";
    private static final String MODE_PHOTO = "photo";

    private PreviewView previewView;
    private Camera camera;
    private ImageCapture imageCapture;
    private ImageAnalysis imageAnalysis;
    private BarcodeScanner barcodeScanner;
    private ExecutorService cameraExecutor;
    private ScaleGestureDetector scaleGestureDetector;
    private String mode;
    private boolean isTorchOn = false;
    private boolean isScaling = false;
    private final AtomicBoolean isAnalyzingFrame = new AtomicBoolean(false);
    private final AtomicBoolean hasReturnedResult = new AtomicBoolean(false);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mode = getIntent().getStringExtra(EXTRA_MODE);
        if (!MODE_PHOTO.equals(mode)) {
            mode = MODE_BARCODE;
        }

        cameraExecutor = Executors.newSingleThreadExecutor();
        if (MODE_BARCODE.equals(mode)) {
            barcodeScanner = BarcodeScanning.getClient();
        }

        buildLayout();
        setupGestures();
        startCamera();
    }

    private void buildLayout() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF000000);

        previewView = new PreviewView(this);
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        root.addView(
            previewView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );

        TextView hint = new TextView(this);
        hint.setText(MODE_PHOTO.equals(mode)
            ? "Pinch to zoom. Tap to focus."
            : "Point at a barcode. Pinch to zoom. Tap to focus.");
        hint.setTextColor(0xFFFFFFFF);
        hint.setTextSize(14);
        hint.setGravity(Gravity.CENTER);
        hint.setBackgroundColor(0x99000000);
        hint.setPadding(18, 10, 18, 10);
        FrameLayout.LayoutParams hintParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.CENTER_HORIZONTAL
        );
        hintParams.topMargin = 42;
        root.addView(hint, hintParams);

        Button closeButton = buildButton("Close");
        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.START
        );
        closeParams.topMargin = 34;
        closeParams.leftMargin = 18;
        root.addView(closeButton, closeParams);
        closeButton.setOnClickListener((view) -> finishCanceled());

        Button torchButton = buildButton("Flash");
        FrameLayout.LayoutParams torchParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.END
        );
        torchParams.topMargin = 34;
        torchParams.rightMargin = 18;
        root.addView(torchButton, torchParams);
        torchButton.setOnClickListener((view) -> toggleTorch(torchButton));

        if (MODE_PHOTO.equals(mode)) {
            Button captureButton = buildButton("Capture");
            captureButton.setTextSize(16);
            captureButton.setPadding(28, 14, 28, 14);
            FrameLayout.LayoutParams captureParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );
            captureParams.bottomMargin = 40;
            root.addView(captureButton, captureParams);
            captureButton.setOnClickListener((view) -> capturePhoto());
        }

        setContentView(root);
    }

    private Button buildButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(0xFFFFFFFF);
        button.setBackgroundColor(0xCC047857);
        button.setPadding(18, 10, 18, 10);
        return button;
    }

    private void setupGestures() {
        scaleGestureDetector = new ScaleGestureDetector(this, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override
            public boolean onScaleBegin(@NonNull ScaleGestureDetector detector) {
                isScaling = true;
                return true;
            }

            @Override
            public boolean onScale(@NonNull ScaleGestureDetector detector) {
                if (camera == null) return false;
                ZoomState zoomState = camera.getCameraInfo().getZoomState().getValue();
                if (zoomState == null) return false;

                float nextZoom = zoomState.getZoomRatio() * detector.getScaleFactor();
                nextZoom = Math.max(zoomState.getMinZoomRatio(), Math.min(nextZoom, zoomState.getMaxZoomRatio()));
                camera.getCameraControl().setZoomRatio(nextZoom);
                return true;
            }
        });

        previewView.setOnTouchListener((view, event) -> {
            scaleGestureDetector.onTouchEvent(event);
            if (event.getActionMasked() == MotionEvent.ACTION_UP) {
                if (!isScaling) {
                    focusAt(event.getX(), event.getY());
                }
                isScaling = false;
                view.performClick();
            } else if (event.getActionMasked() == MotionEvent.ACTION_CANCEL) {
                isScaling = false;
            }
            return true;
        });
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                imageCapture = new ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .build();

                cameraProvider.unbindAll();
                if (MODE_BARCODE.equals(mode)) {
                    imageAnalysis = new ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build();
                    imageAnalysis.setAnalyzer(cameraExecutor, this::analyzeBarcodeFrame);
                    camera = cameraProvider.bindToLifecycle(
                        this,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageCapture,
                        imageAnalysis
                    );
                } else {
                    camera = cameraProvider.bindToLifecycle(
                        this,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageCapture
                    );
                }
            } catch (Exception error) {
                Toast.makeText(this, "Unable to open camera.", Toast.LENGTH_SHORT).show();
                finishCanceled();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void analyzeBarcodeFrame(@NonNull ImageProxy imageProxy) {
        if (barcodeScanner == null || hasReturnedResult.get()) {
            imageProxy.close();
            return;
        }
        if (!isAnalyzingFrame.compareAndSet(false, true)) {
            imageProxy.close();
            return;
        }
        if (imageProxy.getImage() == null) {
            isAnalyzingFrame.set(false);
            imageProxy.close();
            return;
        }

        InputImage image = InputImage.fromMediaImage(
            imageProxy.getImage(),
            imageProxy.getImageInfo().getRotationDegrees()
        );
        barcodeScanner.process(image)
            .addOnSuccessListener(this::handleBarcodeResults)
            .addOnFailureListener((error) -> {
                // Keep scanning if a single frame cannot be processed.
            })
            .addOnCompleteListener((task) -> {
                isAnalyzingFrame.set(false);
                imageProxy.close();
            });
    }

    private void handleBarcodeResults(List<Barcode> barcodes) {
        if (barcodes == null || barcodes.isEmpty() || hasReturnedResult.get()) return;
        for (Barcode barcode : barcodes) {
            String value = barcode.getRawValue();
            if (value != null && !value.trim().isEmpty()) {
                returnBarcode(value.trim());
                return;
            }
        }
    }

    private void focusAt(float x, float y) {
        if (camera == null) return;
        MeteringPoint point = previewView.getMeteringPointFactory().createPoint(x, y);
        FocusMeteringAction action = new FocusMeteringAction.Builder(
            point,
            FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE
        )
            .setAutoCancelDuration(3, TimeUnit.SECONDS)
            .build();
        camera.getCameraControl().startFocusAndMetering(action);
    }

    private void toggleTorch(Button torchButton) {
        if (camera == null || !camera.getCameraInfo().hasFlashUnit()) {
            Toast.makeText(this, "Flash is not available.", Toast.LENGTH_SHORT).show();
            return;
        }
        isTorchOn = !isTorchOn;
        camera.getCameraControl().enableTorch(isTorchOn);
        torchButton.setText(isTorchOn ? "Flash Off" : "Flash");
    }

    private void capturePhoto() {
        if (imageCapture == null || hasReturnedResult.get()) return;
        File file = new File(getCacheDir(), "maintley-label-" + System.currentTimeMillis() + ".jpg");
        ImageCapture.OutputFileOptions options = new ImageCapture.OutputFileOptions.Builder(file).build();
        imageCapture.takePicture(
            options,
            ContextCompat.getMainExecutor(this),
            new ImageCapture.OnImageSavedCallback() {
                @Override
                public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                    if (hasReturnedResult.getAndSet(true)) return;
                    Intent data = new Intent();
                    data.putExtra(RESULT_MODE, MODE_PHOTO);
                    data.putExtra(RESULT_URI, Uri.fromFile(file).toString());
                    setResult(Activity.RESULT_OK, data);
                    finish();
                }

                @Override
                public void onError(@NonNull ImageCaptureException exception) {
                    Toast.makeText(NativeScannerActivity.this, "Could not capture photo.", Toast.LENGTH_SHORT).show();
                }
            }
        );
    }

    private void returnBarcode(String value) {
        if (hasReturnedResult.getAndSet(true)) return;
        Intent data = new Intent();
        data.putExtra(RESULT_MODE, MODE_BARCODE);
        data.putExtra(RESULT_VALUE, value);
        setResult(Activity.RESULT_OK, data);
        finish();
    }

    private void finishCanceled() {
        setResult(Activity.RESULT_CANCELED);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (barcodeScanner != null) {
            barcodeScanner.close();
        }
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }
    }
}