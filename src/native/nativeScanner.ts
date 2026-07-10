import { Capacitor, registerPlugin } from '@capacitor/core';

export type NativeScannerMode = 'barcode' | 'photo';

export type NativeScannerResult = {
	mode?: NativeScannerMode;
	value?: string;
	uri?: string;
};

type NativeScannerPlugin = {
	scan(options: { mode: NativeScannerMode }): Promise<NativeScannerResult>;
};

const NativeScanner = registerPlugin<NativeScannerPlugin>('NativeScanner');

export const isNativeScannerAvailable = (): boolean =>
	Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const scanWithNativeScanner = (mode: NativeScannerMode): Promise<NativeScannerResult> =>
	NativeScanner.scan({ mode });

export const toWebPath = (uri: string): string => Capacitor.convertFileSrc(uri);