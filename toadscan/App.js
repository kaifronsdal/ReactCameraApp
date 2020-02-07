import Constants from 'expo-constants';
import {Camera} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';

import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Slider,
    Platform
} from 'react-native';
import GalleryScreen from './GalleryScreen';
import isIPhoneX from 'react-native-is-iphonex';

import {
    Ionicons,
    MaterialIcons,
    Foundation,
    MaterialCommunityIcons,
    Octicons
} from '@expo/vector-icons';

export default class CameraScreen extends React.Component {
    state = {
        flash: 'off',
        zoom: 0,
        autoFocus: 'on',
        type: 'back',
        whiteBalance: 'auto',
        ratio: '16:9',
        ratios: [],
        newPhotos: false,
        permissionsGranted: false,
        pictureSize: undefined,
        pictureSizes: [],
        pictureSizeId: 0,
        showGallery: false,
        takingPhoto: false,
        showGalleryAwaitPictureSaved: false,
        gallery: undefined,
    };

    async componentWillMount() {
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({permissionsGranted: status === 'granted'});
    }

    componentDidMount() {
        FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'photos').catch(e => {
            console.log(e, 'Directory exists');
        });
    }

    toggleViewAwaitPictureSaved = () => {
        if (this.state.takingPhoto) {
            this.setState({showGalleryAwaitPictureSaved: !this.state.showGalleryAwaitPictureSaved})
        } else {
            this.toggleView();
        }
    };

    toggleView = () => this.setState({showGallery: !this.state.showGallery, newPhotos: false});

    takePicture = () => {
        this.setState({takingPhoto: true});
        if (this.camera) {
            this.camera.takePictureAsync({onPictureSaved: this.onPictureSaved});
        }
    };

    handleMountError = ({message}) => console.error(message);

    onPictureSaved = async photo => {
        await FileSystem.moveAsync({
            from: photo.uri,
            to: `${FileSystem.documentDirectory}photos/${Date.now()}.jpg`,
        });
        if (this.state.showGalleryAwaitPictureSaved) {
            this.toggleView();
        } else {
            this.setState({newPhotos: true});
        }
        this.setState({takingPhoto: false});
    };

    collectPictureSizes = async () => {
        if (this.camera) {
            const pictureSizes = await this.camera.getAvailablePictureSizesAsync(this.state.ratio);
            let pictureSizeId = 0;
            if (Platform.OS === 'ios') {
                pictureSizeId = pictureSizes.indexOf('High');
            } else {
                // returned array is sorted in ascending order - default size is the largest one
                pictureSizeId = pictureSizes.length - 1;
            }
            this.setState({pictureSizes, pictureSizeId, pictureSize: pictureSizes[pictureSizeId]});
        }
    };

    renderGallery() {
        return <GalleryScreen onPress={this.toggleView.bind(this)}/>;
    }

    renderNoPermissions = () =>
        <View style={styles.noPermissions}>
            <Text style={{color: 'white'}}>
                Camera permissions not granted - cannot open camera preview.
            </Text>
        </View>

    renderTopBar = () =>
        <View
            style={styles.topBar}>
        </View>

    renderBottomBar = () =>
        <View
            style={styles.bottomBar}>
            <View style={{flex: 0.4}}>
                <TouchableOpacity
                    onPress={this.takePicture}
                    style={{alignSelf: 'center'}}
                >
                    <Ionicons name="ios-radio-button-on" size={70} color="white"/>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.bottomButton} onPress={this.toggleViewAwaitPictureSaved}>
                <View>
                    <Foundation name="thumbnails" size={30} color="white"/>
                    {this.state.newPhotos && <View style={styles.newPhotosDot}/>}
                </View>
            </TouchableOpacity>
        </View>

    renderCamera = () =>
        (
            <View style={{flex: 1}}>
                <Camera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    style={styles.camera}
                    onCameraReady={this.collectPictureSizes}
                    type={this.state.type}
                    flashMode={this.state.flash}
                    autoFocus={this.state.autoFocus}
                    zoom={this.state.zoom}
                    whiteBalance={this.state.whiteBalance}
                    ratio={this.state.ratio}
                    pictureSize={this.state.pictureSize}
                    onMountError={this.handleMountError}
                >
                    {this.renderTopBar()}
                    {this.renderBottomBar()}
                </Camera>
            </View>
        );

    render() {
        const cameraScreenContent = this.state.permissionsGranted
            ? this.renderCamera()
            : this.renderNoPermissions();
        const content = this.state.showGallery ? this.renderGallery() : cameraScreenContent;
        return <View style={styles.container}>{content}</View>;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topBar: {
        flex: 0.2,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: Constants.statusBarHeight / 2,
    },
    bottomBar: {
        paddingBottom: isIPhoneX ? 25 : 5,
        backgroundColor: 'transparent',
        alignSelf: 'flex-end',
        justifyContent: 'space-between',
        flex: 0.12,
        flexDirection: 'row',
    },
    noPermissions: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    gallery: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    bottomButton: {
        flex: 0.3,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newPhotosDot: {
        position: 'absolute',
        top: 0,
        right: -5,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4630EB'
    },
});
