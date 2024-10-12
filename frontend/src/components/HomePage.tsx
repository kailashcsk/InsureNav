import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Heart, Home, Umbrella, DollarSign, Car, Star, ChevronRight, Moon, Sun } from "lucide-react"

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useTheme } from "next-themes"

const insuranceTypes = [
    { id: 1, type: "Health Insurance", description: "Comprehensive coverage for your well-being.", icon: Heart },
    { id: 2, type: "Life Insurance", description: "Secure your family's future.", icon: Shield },
    { id: 3, type: "Property Insurance", description: "Protect your home and belongings.", icon: Home },
    { id: 4, type: "Umbrella Insurance", description: "Extra protection for peace of mind.", icon: Umbrella },
    { id: 5, type: "Income Protection", description: "Safeguard your financial stability.", icon: DollarSign },
    { id: 6, type: "Auto Insurance", description: "Drive with confidence and security.", icon: Car },
]

const mockProducts = [
    { id: 1, name: "HealthGuard Plus", type: 1, rating: 4.8, reviews: 1200 },
    { id: 2, name: "LifeSecure Premium", type: 2, rating: 4.7, reviews: 980 },
    { id: 3, name: "HomeSafe Elite", type: 3, rating: 4.9, reviews: 1500 },
    { id: 4, name: "UmbrellaPro Max", type: 4, rating: 4.6, reviews: 750 },
    { id: 5, name: "IncomeSheild Advanced", type: 5, rating: 4.5, reviews: 620 },
    { id: 6, name: "AutoGuard Deluxe", type: 6, rating: 4.7, reviews: 1100 },
    { id: 7, name: "HealthEssentials", type: 1, rating: 4.4, reviews: 890 },
    { id: 8, name: "LifeCover Basic", type: 2, rating: 4.3, reviews: 560 },
    { id: 9, name: "PropertyProtect Standard", type: 3, rating: 4.5, reviews: 720 },
    { id: 10, name: "UmbrellaShield Lite", type: 4, rating: 4.2, reviews: 480 },
    { id: 11, name: "IncomeGuard Flex", type: 5, rating: 4.6, reviews: 810 },
    { id: 12, name: "AutoSafe Economy", type: 6, rating: 4.4, reviews: 950 },
]

const mockUsers = [
    { id: 1, age: 30, maritalStatus: "single", occupation: "employed", purchasedProducts: [1, 3, 6] },
    { id: 2, age: 45, maritalStatus: "married", occupation: "self-employed", purchasedProducts: [2, 3, 4, 5] },
    { id: 3, age: 25, maritalStatus: "single", occupation: "student", purchasedProducts: [1, 7, 12] },
    { id: 4, age: 60, maritalStatus: "married", occupation: "retired", purchasedProducts: [2, 3, 4, 6, 11] },
    { id: 5, age: 35, maritalStatus: "married", occupation: "employed", purchasedProducts: [1, 2, 3, 6, 9] },
]


export default function HomePage() {


    interface UserProfile {
        age?: number; // optional fields
        maritalStatus?: string;
        occupation?: string;
        // add other fields as needed
    }
    
    interface Recommendation {
        id: number;
        name: string;
        type: number;
        rating: number;
        reviews: number;
    }
    

    const [userProfile, setUserProfile] = useState<UserProfile>({ age: 30, maritalStatus: "single", occupation: "employed" })
    const [recommendations, setRecommendations] = useState<{ popularity: Recommendation[], contentBased: Recommendation[], collaborative: Recommendation[] }>({ popularity: [], contentBased: [], collaborative: [] })
    const { theme, setTheme } = useTheme()


    const handleProfileChange = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
        setUserProfile(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const popularityBased = getPopularityBasedRecommendations(3, 4.5, 500)
        const contentBased = getContentBasedRecommendations(3)
        const collaborative = getCollaborativeRecommendations(3, 2)

        setRecommendations({ popularity: popularityBased, contentBased, collaborative })
    }, [userProfile])

    const getPopularityBasedRecommendations = (n: number, minRating: number, minReviews: number) => {
        return mockProducts
            .filter(product => product.rating >= minRating && product.reviews >= minReviews)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, n)
    }

    const getContentBasedRecommendations = (n: number) => {
        const mostPopular = mockProducts.sort((a, b) => b.reviews - a.reviews)[0]
        return mockProducts
            .filter(product => product.type === mostPopular.type && product.id !== mostPopular.id)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, n)
    }

    const getCollaborativeRecommendations = (n: number, k: number) => {
        const similarUsers = mockUsers
            .filter(user => user.id !== 1)
            .sort((a, b) => {
                const ageSimA = Math.abs(a.age - (userProfile.age ?? 0))
                const ageSimB = Math.abs(b.age - (userProfile.age ?? 0))
                const maritalSimA = a.maritalStatus === userProfile.maritalStatus ? 0 : 1
                const maritalSimB = b.maritalStatus === userProfile.maritalStatus ? 0 : 1
                return (ageSimA + maritalSimA) - (ageSimB + maritalSimB)
            })
            .slice(0, k)

        const recommendedProductIds = new Set(similarUsers.flatMap(user => user.purchasedProducts))
        return mockProducts
            .filter(product => recommendedProductIds.has(product.id))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, n)
    }

    const renderRecommendations = (recs: Recommendation[]) => {
        return recs.map((product, index) => {
            const insuranceType = insuranceTypes.find(t => t.id === product.type)
            return (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                {insuranceType && <insuranceType.icon className="w-6 h-6" />}
                                <span>{product.name}</span>
                            </CardTitle>
                            {insuranceType && <CardDescription>{insuranceType.description}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-primary' : 'fill-muted stroke-muted-foreground'}`} />
                                ))}
                                <span className="text-sm text-muted-foreground ml-2">({product.reviews} reviews)</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">
                                Learn more <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )
        })
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold">InsureNav</h1>
                        <p className="text-xl text-muted-foreground">Smart Insurance Recommendations</p>
                    </motion.div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Profile</CardTitle>
                            <CardDescription>Customize your insurance preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={userProfile.age}
                                        onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Marital Status</Label>
                                    <RadioGroup
                                        value={userProfile.maritalStatus}
                                        onValueChange={(value) => handleProfileChange('maritalStatus', value)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="single" id="single" />
                                            <Label htmlFor="single">Single</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="married" id="married" />
                                            <Label htmlFor="married">Married</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Select value={userProfile.occupation} onValueChange={(value) => handleProfileChange('occupation', value)}>
                                        <SelectTrigger id="occupation">
                                            <SelectValue placeholder="Select occupation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employed">Employed</SelectItem>
                                            <SelectItem value="self-employed">Self-employed</SelectItem>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="retired">Retired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-center">Your Personalized Recommendations</h2>
                        <Tabs defaultValue="popularity" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="popularity">Popular</TabsTrigger>
                                <TabsTrigger value="contentBased">Similar</TabsTrigger>
                                <TabsTrigger value="collaborative">For You</TabsTrigger>
                            </TabsList>
                            <TabsContent value="popularity" className="mt-6">
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {renderRecommendations(recommendations.popularity)}
                                </div>
                            </TabsContent>
                            <TabsContent value="contentBased" className="mt-6">
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {renderRecommendations(recommendations.contentBased)}
                                </div>
                            </TabsContent>
                            <TabsContent value="collaborative" className="mt-6">
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {renderRecommendations(recommendations.collaborative)}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}