import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader";
import toast, { Toaster } from "react-hot-toast";
import InputBox from "../components/input";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {

    const navigate = useNavigate();

    let { userAuth, userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    let bioLimit = 150;

    let profileImgEle = useRef();
    let editProfileForm = useRef();

    const [ profile, setProfile ] = useState(profileDataStructure);
    const [ loading, setLoading ] = useState(true);
    const [ charactersLeft, setCharctersLeft ] = useState(bioLimit);
    const [ updatedProfileImg, setUpdatedProfileImg ] = useState(null);

    const profileData = profile ? profile : profileDataStructure; // Default structure if profile is null
    let { personal_info: { fullname, username: profile_username, profile_img, email, bio }, social_links } = profileData;

    useEffect(() => {

        if(access_token){
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", { username: userAuth.username })
            .then(({ data }) => {
                setProfile(data);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
            })
        }

    }, [access_token])

    const handleCharacterChange = (e) => {
        setCharctersLeft(bioLimit - e.target.value.length)
    }

    const handleImagePreview = (e) => {

        let img = e.target.files[0];

        profileImgEle.current.src = URL.createObjectURL(img);

        setUpdatedProfileImg(img);
    }

    const handleImageUpload = (e) => {
        e.preventDefault();
    
        if (updatedProfileImg) {
            let loadingToast = toast.loading("Uploading...");
            e.target.setAttribute("disabled", true);
    
            const formData = new FormData();
            formData.append('profile_img', updatedProfileImg); // Assuming 'profile_img' is the field name on the backend
    
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/update-profile-img", formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${access_token}`
                }
            })
            .then(({ data }) => {
                let newUserAuth = { ...userAuth, profile_img: data.profile_img };
    
                sessionStorage.setItem("user", JSON.stringify(newUserAuth));
                setUserAuth(newUserAuth);
    
                setUpdatedProfileImg(null);
    
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                toast.success("Uploaded 👍");
            })
            .catch(({ response }) => {
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                toast.error(response?.data?.error || 'Upload failed');
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let form = new FormData(editProfileForm.current);
        let formData = { };

        for(let [key, value] of form.entries()){
            formData[key] = value;
        }

        let { username, bio, youtube, facebook, twitter, github, instagram, website } = formData;

        if(username.length < 3){
            return toast.error("Username should be al least 3 characters long")
        }
        if(bio.length > bioLimit){
            return toast.error(`Bio should not be more than ${bioLimit} characters`)
        }

        let loadingToast = toast.loading("Updating...");
        e.target.setAttribute("disabled", true);

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/update-profile", {
            username, bio, 
            social_links: { youtube, facebook, twitter, github, instagram, website }
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(({ data }) => {

            if(userAuth.username != data.username){

                let newUserAuth = { ...userAuth, username: data.username };
                
                sessionStorage.setItem("user", JSON.stringify(newUserAuth));
                setUserAuth(newUserAuth);

            }

            toast.dismiss(loadingToast);
            e.target.removeAttribute("disabled");
            toast.success("Profile Updated")

        })
        .catch(({ response }) => {
            toast.dismiss(loadingToast);
            e.target.removeAttribute("disabled");
            toast.error(response.data.error)
        })

    }

    const handleDeleteProfile = async (e) => {
        e.preventDefault(); // Prevent form submission
        
        // Show confirmation dialog
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
    
        try {
            const loadingToast = toast.loading('Deleting account...');
    
            const response = await axios.delete(import.meta.env.VITE_SERVER_DOMAIN + '/delete-user', {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
    
            if (response.status === 200) {
                // Clear all authentication data
                sessionStorage.removeItem('user');
                localStorage.removeItem('jwtToken');
                
                // Update auth context
                setUserAuth({ access_token: null });
                
                toast.dismiss(loadingToast);
                toast.success('Account deleted successfully');
                
                // Redirect to signup page
                navigate('/signup');
            } else {
                toast.dismiss(loadingToast);
                toast.error('Unexpected response from server. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error(error.response?.data?.error || 'There was an error deleting your account. Please try again.');
        }
    };

    return (
        <AnimationWrapper>
            {
                loading ? <Loader /> :
                <form ref={editProfileForm}>
                    <Toaster />

                    <h1 className="max-md:hidden">Edit Profile</h1>

                    <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
                        
                        <div className="max-lg:center mb-5">
                            <label htmlFor="uploadImg" id="profileImgLable"
                            className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden">
                                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer">
                                    Upload Image
                                </div>
                                <img ref={profileImgEle} src={profile_img} referrerPolicy="no-referrer" />
                            </label>

                            <input type="file" id="uploadImg" accept=".jpeg, .png, .jpg" hidden onChange={handleImagePreview} />

                            <button className="btn-light mt-5 max-lg:center lg:w-full px-10" onClick={handleImageUpload}>Upload</button>
                        </div>

                        <div className="w-full">

                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                                <div>
                                    <InputBox name="fullname" type="text" value={fullname} placeholder="Full Name" disable={true} icon="fi-rr-user" />
                                </div>
                                <div>
                                    <InputBox name="email" type="email" value={email} placeholder="Email" disable={true} icon="fi-rr-envelope" />
                                </div>
                            </div>

                            <InputBox type="text" name="username" value={profile_username} placeholder="Username" icon="fi-rr-at" />

                            <p className="text-dark-grey -mt-3">Username will use to search user and will be visible to all users</p>

                            <textarea name="bio" maxLength={bioLimit} defaultValue={bio} className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5" placeholder="Bio" onChange={handleCharacterChange}></textarea>

                            <p className="mt-1 text-dark-grey">{ charactersLeft } characters left</p>

                            <p className="my-6 text-dark-grey">Add your social handles below</p>

                            <div className="md:grid md:grid-cols-2 gap-x-6">

                                {

                                    Object.keys(social_links).map((key, i) => {

                                        let link = social_links[key];

                                        return <InputBox key={i} name={key} type="text" value={link} placeholder="https://" icon={"fi " + (key != 'website' ? "fi-brands-" + key : "fi-rr-globe")}  />

                                    })

                                }

                            </div>

                            <div className="flex justify-between mt-6">
                                <button className="btn-dark w-auto px-10" type="submit" onClick={handleSubmit}>Update</button>
                                <button className="btn-dark bg-rose-950 text-black w-auto px-10" type="button" onClick={handleDeleteProfile}>Delete Profile</button>
                            </div>

                        </div>

                    </div>
                </form>
            }
        </AnimationWrapper>
    )
}

export default EditProfile;