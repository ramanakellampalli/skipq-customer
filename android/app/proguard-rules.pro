# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-config: RNCConfigModuleImpl reads env vars from BuildConfig via reflection
-keep class com.skipqcustomer.BuildConfig { *; }
-keep class com.lugg.RNCConfig.** { *; }

# react-native-keychain
-keep class com.oblador.keychain.** { *; }
-keep class androidx.biometric.** { *; }
-keep class androidx.security.** { *; }
-keep class android.security.** { *; }

# react-native-biometrics
-keep class com.rnbiometrics.** { *; }
-keep class com.reactnativebiometrics.** { *; }

# OkHttp / networking
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# JNI native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
