# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-keychain
-keep class com.oblador.keychain.** { *; }
-keep class androidx.biometric.** { *; }
-keep class androidx.security.** { *; }
-keep class android.security.** { *; }

# react-native-biometrics
-keep class com.rnbiometrics.** { *; }
-keep class com.reactnativebiometrics.** { *; }

# Additional security/biometric classes
-keep class androidx.biometric.BiometricPrompt { *; }
-keep class androidx.biometric.BiometricPrompt$PromptInfo { *; }
-keep class androidx.biometric.BiometricPrompt$AuthenticationResult { *; }
-keep class androidx.core.content.ContextCompat { *; }
-keep class androidx.fragment.app.FragmentActivity { *; }

# JNI native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep all model classes
-keep class * extends androidx.fragment.app.Fragment { *; }
-keep class * extends android.app.Activity { *; }
